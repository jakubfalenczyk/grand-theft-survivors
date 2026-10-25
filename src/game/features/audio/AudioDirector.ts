import Phaser from 'phaser';
import type { AppServices } from '../../../shared/services.ts';
import type { AudioCue, AudioStatus } from '../../../shared/audio/types.ts';
import { busVolume } from '../../../shared/audio/AudioSettings.ts';
import { seededRandom } from '../../../shared/math.ts';
import { audioLimits, audioManifest, soundAssets, soundKey } from './manifest.ts';
import type { CueDefinition, SoundId } from './manifest.ts';

type Playable = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
interface Voice {
  sound: Playable;
  cue: string;
  definition: CueDefinition;
}

export function preloadAudio(scene: Phaser.Scene) {
  if (scene.sound instanceof Phaser.Sound.NoAudioSoundManager) return;
  for (const [id, filename] of Object.entries(soundAssets)) {
    const key = soundKey(id as SoundId);
    if (!scene.cache.audio.exists(key))
      scene.load.audio(key, `${import.meta.env.BASE_URL}audio/${filename}`, undefined, {
        responseType: 'arraybuffer',
        timeout: audioLimits.loadTimeoutMs,
      });
  }
}

/** One scene owns its voices and subscriptions. The Phaser cache survives scene restart. */
export class AudioDirector {
  #scene: Phaser.Scene;
  #services: AppServices;
  #voices: Voice[] = [];
  #lastPlayed = new Map<string, number>();
  #random = seededRandom(audioLimits.audioSeed);
  #cleanups: (() => void)[];
  #destroyed = false;
  #played = 0;
  #lastCue = '';
  #status: AudioStatus;
  #loadStatus: AudioStatus;
  constructor(scene: Phaser.Scene, services: AppServices) {
    this.#scene = scene;
    this.#services = services;
    const loaded = Object.keys(soundAssets).filter((id) =>
      scene.cache.audio.exists(soundKey(id as SoundId)),
    ).length;
    this.#status =
      loaded === Object.keys(soundAssets).length ? 'ready' : loaded ? 'partial' : 'unavailable';
    this.#loadStatus = this.#status;
    this.#cleanups = [
      services.bus.on('audio:cue', (cue) => this.play(cue)),
      services.audio.subscribe(() => {
        for (const voice of this.#voices) voice.sound.setVolume(this.#volume(voice.definition));
      }),
      services.session.subscribe(() => {
        if (services.session.blocked) this.#stopWorld();
      }),
    ];
    services.bus.emit('audio:status', this.#status);
    this.play({ id: 'ui:confirm' });
  }
  #volume(definition: CueDefinition) {
    return definition.gain * busVolume(this.#services.audio.state, definition.bus);
  }
  play(cue: AudioCue) {
    if (this.#destroyed) return;
    const definition =
      cue.id === 'player:footstep' ? audioManifest.footsteps[cue.surface] : audioManifest[cue.id];
    if ((definition.bus !== 'ui' && this.#services.session.blocked) || !this.#volume(definition))
      return;
    const manager = this.#scene.sound;
    if (
      manager instanceof Phaser.Sound.WebAudioSoundManager &&
      manager.context.state !== 'running'
    ) {
      // UI cues are emitted synchronously from native input, so resume retains user activation.
      if (definition.bus === 'ui')
        void manager.context
          .resume()
          .then(() => {
            if (manager.context.state === 'running') {
              this.#report(this.#loadStatus);
              this.play(cue);
            } else this.#report('unavailable');
          })
          .catch(() => this.#report('unavailable'));
      return;
    }
    const key = cue.id === 'player:footstep' ? `${cue.id}:${cue.surface}` : cue.id;
    const now = this.#scene.game.loop.time;
    if (now - (this.#lastPlayed.get(key) ?? -Infinity) < definition.cooldownMs) return;
    const available = definition.variants.filter((variant) =>
      this.#scene.cache.audio.exists(soundKey(variant.sound)),
    );
    if (!available.length) return;
    let pick = this.#random() * available.reduce((total, variant) => total + variant.weight, 0);
    const variant =
      available.find((entry) => {
        pick -= entry.weight;
        return pick <= 0;
      }) ?? available[available.length - 1];
    const same = this.#voices.filter((voice) => voice.cue === key);
    if (same.length >= definition.maxVoices) this.#remove(same[0]);
    if (this.#voices.length >= audioLimits.maxVoices) {
      const victim = this.#voices.find((voice) => voice.definition.priority <= definition.priority);
      if (!victim) return;
      this.#remove(victim);
    }
    let voice: Voice | undefined;
    try {
      const sound = manager.add(soundKey(variant.sound));
      if (!(
        sound instanceof Phaser.Sound.WebAudioSound || sound instanceof Phaser.Sound.HTML5AudioSound
      )) {
        sound.destroy();
        return;
      }
      voice = { sound, cue: key, definition };
      const ownedVoice = voice;
      this.#voices.push(voice);
      sound.once(Phaser.Sound.Events.COMPLETE, () => this.#remove(ownedVoice));
      const started = sound.play({
        volume: this.#volume(definition),
        rate: definition.rate[0] + this.#random() * (definition.rate[1] - definition.rate[0]),
        loop: definition.loop,
      });
      if (!started) {
        this.#remove(voice);
        this.#report('unavailable');
        return;
      }
      this.#lastPlayed.set(key, now);
      this.#played++;
      this.#lastCue = key;
    } catch {
      if (voice) this.#remove(voice);
      this.#report('partial');
    }
  }
  #report(status: AudioStatus) {
    if (this.#destroyed) return;
    this.#status = status;
    this.#services.bus.emit('audio:status', status);
  }
  #remove(voice: Voice) {
    this.#voices = this.#voices.filter((entry) => entry !== voice);
    voice.sound.removeAllListeners();
    voice.sound.destroy();
  }
  #stopWorld() {
    for (const voice of [...this.#voices]) if (voice.definition.bus !== 'ui') this.#remove(voice);
  }
  getSnapshot() {
    const manager = this.#scene.sound;
    return {
      status: this.#status,
      played: this.#played,
      lastCue: this.#lastCue,
      active: this.#voices.map((voice) => ({
        cue: voice.cue,
        bus: voice.definition.bus,
        volume: voice.sound.volume,
      })),
      context:
        manager instanceof Phaser.Sound.WebAudioSoundManager
          ? manager.context.state
          : 'unavailable',
      managed: manager instanceof Phaser.Sound.NoAudioSoundManager ? 0 : manager.getAll().length,
      cached: Object.keys(soundAssets).filter((id) =>
        this.#scene.cache.audio.exists(soundKey(id as SoundId)),
      ).length,
    };
  }
  destroy() {
    this.#destroyed = true;
    this.#cleanups.forEach((cleanup) => cleanup());
    for (const voice of [...this.#voices]) this.#remove(voice);
  }
}
