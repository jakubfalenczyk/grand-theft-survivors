import type { AppServices } from '../../shared/services.ts';
import { AUDIO_BUSES } from '../../shared/audio/types.ts';
import { t } from '../../shared/intl/index.ts';
import { element } from '../dom.ts';

export function attachAudioControls(root: HTMLElement, { audio, bus }: AppServices) {
  const events = new AbortController();
  const fields = element(root, '#audio-fields');
  const inputs = new Map<string, { input: HTMLInputElement; output: HTMLOutputElement }>();
  for (const id of AUDIO_BUSES) {
    const row = document.createElement('div');
    row.className = ['player', 'enemy', 'world', 'ui'].includes(id)
      ? 'audio-row audio-child'
      : 'audio-row';
    const label = document.createElement('label');
    label.htmlFor = `audio-${id}`;
    label.textContent = t(`audio.bus.${id}`);
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    const output = document.createElement('output');
    output.htmlFor = input.id;
    row.append(label, input, output);
    fields.append(row);
    inputs.set(id, { input, output });
    input.addEventListener('input', () => audio.setVolume(id, Number(input.value) / 100), {
      signal: events.signal,
    });
    input.addEventListener('change', () => bus.emit('audio:cue', { id: 'ui:change' }), {
      signal: events.signal,
    });
  }
  const mute = element<HTMLInputElement>(root, '#audio-mute');
  mute.addEventListener('change', () => audio.setMuted(mute.checked), { signal: events.signal });
  const stopSettings = audio.subscribe((state) => {
    mute.checked = state.muted;
    for (const id of AUDIO_BUSES) {
      const field = inputs.get(id)!;
      const percentage = Math.round(state.volumes[id] * 100);
      field.input.value = String(percentage);
      field.output.textContent = t('audio.percent', { value: percentage });
    }
  });
  const stopStatus = bus.on('audio:status', (status) => {
    element(root, '#audio-status').textContent = t(`audio.status.${status}`);
  });
  return () => {
    events.abort();
    stopSettings();
    stopStatus();
  };
}
