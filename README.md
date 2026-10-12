# Temper — just intonation studio

A playable TypeScript / Web Audio instrument with an exact 5-limit Tonnetz and a three-octave piano keyboard. Includes repitched piano samples, soft electric synthesis, filtered sawtooth, additive organ, and sine voices.

```sh
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` creates the static site in `dist/`; `npm test` checks the supplied reference patch, all three axes, octave doubling, equal semitones, and tempered lattice axes. Node 22.18+ is required for the tests.

## Playing

- Switch **Tonnetz / Dual lattice** above the canvas. The dual view uses note circles (one note), small edge circles (two-note intervals), and major/minor triangles (three-note chords). Chord and interval targets are disabled if any member falls outside the selected scale. Shared notes remain held when gliding between neighboring groups.
- Hold hexagons or piano keys with a mouse or touch; drag for glissando and use multiple touches for chords.
- A S D F G H J K play white keys, W E T Y U play accidentals. O and L extend above the octave. The keyboard shortcuts follow the middle visible octave.
- Space toggles sustain; Escape or Release all stops everything. A focused note can also be played with Enter or Space.
- Scroll the lattice to pan. Use +/− to zoom and ↺ or R to reset the initial view with C4 visible.
- Switch JI / 12TET to compare the exact 5-limit ratios with equal semitones. C4 remains fixed; A4 is 436.04 Hz in JI and 440 Hz in 12TET. Changing tuning releases sounding notes.
- Sustain starts enabled. Choose Chromatic (default), C major Diatonic, or C major Pentatonic (C, D, E, G, A). Toggle octave borders, or the four label modes (note + octave + ratio, note + octave, note only, or hidden).

Settings—including visualization mode, tuning, scale, voice, volume, release length, sustain, borders, labels, keyboard octave, and lattice pan/zoom—are saved in browser localStorage and restored on refresh. **Reset settings** in the footer restores every default, including the initial C4 view.

## Tuning

C4 = 261.6255653 Hz. The central twelve-note patch uses:

| Note | Ratio to C |
| --- | --- |
| C | 1/1 |
| C♯ | 25/24 |
| D | 9/8 |
| E♭ | 6/5 |
| E | 5/4 |
| F | 4/3 |
| F♯ | 45/32 |
| G | 3/2 |
| G♯ | 25/16 |
| A | 5/3 |
| B♭ | 9/5 |
| B | 15/8 |

Flat-top hexagon coordinates `(q, r)` map to `(4/5)^q × (3/2)^r`, with octave shifts. Up is 3/2, upper-left is 5/4 (major third), upper-right is 6/5. The central patch has octave 4, with successive four-row bands extending registers. Note spelling follows lattice interval steps, preserving comma variants rather than forcing them to an equal-tempered pitch class. Exact rational labels are calculated from integer prime exponents.

An infinite pure lattice cannot be collapsed into twelve periodically repeating pitch classes. Outside the reference patch, identical note names may differ by commas. The piano repeats the central twelve ratios through octaves; the two views light up together only when frequencies actually match.

## Piano samples

Five Salamander Grand Piano samples are bundled locally; playback rate is `targetHz / sampleHz`. Sampled notes therefore play at just-intonation frequencies. The samples have natural decay, including while held. With sustain enabled, sampled piano playback continues with its original natural decay after note-off; no extra gain envelope is applied. Synth voices remain active while held and fade over the selected release length with sustain (0.1–12 seconds, default 5.5 seconds). Changes apply to subsequent releases; existing tails finish smoothly. With the pedal off, all voices fade to silence over 100 ms. Retriggering allows released tails to overlap, and active voice replacement or Release all uses a short smooth fade to prevent abrupt cutoffs.

Samples: [Salamander Grand Piano by Alexander Holm](https://github.com/tonejs/audio/tree/master/salamander), CC BY 3.0. See `public/samples/ATTRIBUTION.md`.

Fonts are requested from Google Fonts, with system and Georgia fallbacks. No audio is transmitted; audio is rendered in the browser. The app uses native Web Audio so no audio library or external service is needed during playback.

Tuning reference: [Five-limit tuning](https://en.wikipedia.org/wiki/Five-limit_tuning).

To verify the audio envelopes with native browser rendering, open `http://localhost:5173/tests/audio.html` during development and click **Run offline audio checks**. The checks compare held and sustained piano waveforms, measure 100 ms releases for every voice, and check continuity during repeated retriggers, early note-off, and pedal changes.

Dual-view interaction reference: [The Tonnetz](https://thetonnetz.com/). The dual uses the same lattice coordinates and exact note frequencies as the hexagonal view.

## GitHub Pages

The `.github/workflows/pages.yml` workflow tests, builds, and deploys the app on pushes to `master`. Enable **Settings → Pages → Source → GitHub Actions** in the repository. The workflow derives Vite's base path from the Pages configuration, so JavaScript, styles, and bundled piano samples resolve under the project's URL. You can also deploy manually from the Actions tab.
