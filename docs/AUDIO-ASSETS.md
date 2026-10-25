# Audio assets

Downloaded 2026-10-24. Only these seven exports are shipped. Source archives are downloaded to temporary storage. Extracted originals are retained locally in `.local/audio-packs/`, which Git and repository checks ignore. They are not published. The selected samples were checked for duration, silence and peak level. The owner can review their sound in the game and replace entries in the manifest. No listening approval has been recorded.

| Export           | Source file                                        | Seconds |
| ---------------- | -------------------------------------------------- | ------- |
| `concrete-1.wav` | `Free Footsteps Pack/Concrete 1.wav`               | 0.29    |
| `concrete-2.wav` | `Free Footsteps Pack/Concrete 2.wav`               | 0.219   |
| `grass-1.wav`    | `Free Footsteps Pack/Grass 1.wav`                  | 0.26    |
| `grass-2.wav`    | `Free Footsteps Pack/Grass Running.wav`            | 0.298   |
| `ui-confirm.wav` | `Wav/Confirm_tones/style5/confirm_style_5_001.wav` | 0.635   |
| `ui-back.wav`    | `Wav/Back_tones/style5/back_style_5_001.wav`       | 0.561   |
| `ui-change.wav`  | `Wav/Cursor_tones/cursor_style_4.wav`              | 0.528   |

Mayra owns the footsteps. ObsydianX released the interface sounds under CC0. See the retained [Mayra permission](../public/licenses/audio-mayra.txt) and [ObsydianX license](../public/licenses/audio-obsydianx.txt). Mayra's older credit request is satisfied by the in-game credit. These assets are not relicensed under the code license.

Exports are mono 16-bit PCM WAV at the original sample rate. Source stereo was averaged to mono; leading/trailing silence was trimmed; peaks were normalized to 0.35; each edge received a 3 ms fade. `grass-1.wav` uses the first 0.26 seconds of `Grass 1.wav` to isolate a single step. Other files use the complete audible event.

## Source file hashes

SHA-256 identifies the original files without storing unused pack contents.

- `Free Footsteps Pack/Concrete 1.wav`: `4b9cf6595ca89b1776ed561909f4bb662b0c0d3efb7bc05673f3a394d9b9b8e6`
- `Free Footsteps Pack/Concrete 2.wav`: `0e9ca2c07632efba7b71014c1f14d22d003d93ebbc8fa9f3e118519f6beb6aef`
- `Free Footsteps Pack/Grass 1.wav`: `3183e9f6cf0a965b3a8e3a347988cdce268bbf17bda05f52ad3b0f1939a30900`
- `Free Footsteps Pack/Grass Running.wav`: `0a1988737c6c3292db8af484dd1a6702d851c92b062bf466fb4e16e29be5a039`
- `Wav/Confirm_tones/style5/confirm_style_5_001.wav`: `d76e27331c0392afda66ec07f81c6b556a57fec0d58f4e35ea124c49eedbe51b`
- `Wav/Back_tones/style5/back_style_5_001.wav`: `808be63b75c9c9443fe50634d9b1bc900d0bd11077392611b31e950c81026cbe`
- `Wav/Cursor_tones/cursor_style_4.wav`: `8726bf3a9787172af2447ae87fd58c6a2d3d2ef3919e1a916f35dbfc5a8e246d`

## Local source library

The original Mayra and ObsydianX packs are available under `.local/audio-packs/mayra-footsteps/` and `.local/audio-packs/obsydianx-interface/` on the working machine. These ignored files do not arrive in a fresh clone. Download them from the source pages listed in the retained notices when setting up another machine. Keep archives in temporary storage and extract only into the ignored directory.

Audition originals there, then copy and process only selected effects into `public/audio/`. Add the selected filenames, transformations and license to this inventory and the manifest. Never import or copy the whole local library into the build.
