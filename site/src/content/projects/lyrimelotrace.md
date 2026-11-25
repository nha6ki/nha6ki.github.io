---
title: "LyriMeloTrace"
categories: ["ai","web","analysis"]
summary: "An interactive music demo that synchronizes a song with two emotion trajectories estimated independently from its lyrics and recording."
date: "2026-11"
technologies:
  - Python
  - PyTorch
  - Hugging Face Transformers
  - Essentia
  - JavaScript
  - SVG
  - HTML Audio
  - GitHub Pages
order: 6
featured: true
image: "/images/projects/lyrimelotrace-trajectories.svg"
imageAlt: "Data illustration of LyriMeloTrace: blue lyric and amber recording trajectories for Schubert’s Frühlingstraum on shared Valence–Arousal axes."
links:
  - label: "Live Demo"
    url: "https://nha6ki.github.io/LyriMeloTrace/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/LyriMeloTrace"
---

## Listen, follow, compare

I built LyriMeloTrace to explore how emotion estimates from a song’s words and its musical performance change over time. The demo follows Schubert’s *Frühlingstraum* (*Spring Dream*, from *Winterreise*) through its original German lyrics and the HU33 recording by Gerhard Hüsch and Hanns-Udo Müller.

Two colored trajectories share a Valence–Arousal plot: blue for lyrics and amber for the recording, including both singing and piano. Valence describes pleasantness; arousal describes activation. Playback moves the current position along each trajectory while showing the corresponding lyric line.

The figure above redraws the saved full-song trajectories with the demo’s display interpolation. The live application adds playback, synchronized lyrics, and moving position markers. Its interface is in Japanese, with German lyrics.

## Two views of the same results

**Experience** keeps attention on the music and the trajectories. It combines smooth paths, a short glowing trail, thin axes, and the current lyric with playback, seeking, and volume controls.

**Analysis** shows the original prediction points, Valence and Arousal timelines, all 36 lyric lines, and the song’s annotated sections. Selecting a lyric starts playback one second before the line. Both views share the same audio and playback position, so switching views does not restart the recording.

I chose *Frühlingstraum* for its contrasts between dreams, awakenings, and questioning passages, and for the return of its A–B–C structure. These changes provide recognizable passages to inspect while listening. The section names guide exploration; they are not ground-truth emotion labels.

## Independent models, one playback clock

The offline Python pipeline uses **Mendes & Martins’ XLM-RoBERTa-large MSE** model for the lyrics and **MSD-MusiCNN with a DEAM regression head in Essentia** for the recording.

Each of the 36 German lyric lines is inferred independently, retaining its punctuation and capitalization. The music model receives the full voice-and-piano signal, resampled to mono at 16 kHz, with no additional gain. Its displayed series contains 84 averages over six-second windows, advancing by three seconds with an adjusted final window.

Both models directly regress Valence and Arousal. Their outputs are rescaled to the display range: `2*x - 1` for lyrics and `(x - 5)/4` for music. Experience applies shape-preserving interpolation to each axis and separates lyric curves at vocal-section boundaries. This produces smooth motion while retaining the original anchor values; interpolated positions are display values, not new predictions.

## Synchronization and reproducibility

I aligned lyric syllables in the MusicXML score with the dataset’s timed vocal-note annotations. Normalizing ties and preserving grace notes produced 296 matched vocal events, all with a consistent two-semitone transposition between the score and recording annotations. The resulting 36 lyric intervals were checked by listening. This process did not use speech recognition or vocal separation.

The browser runs on saved JSON and an included recording, without an inference server or audio-file selection step. The public repository includes the interface, model-result provenance, audio identity checks, tests, and a GitHub Pages deployment workflow. It reproduces the visualization of the saved results; it does not include model weights or the complete inference pipeline.

## Interpretation and limits

The trajectories are model estimates, not measurements of a listener’s feelings or definitive readings of the poem. Their accuracy on this song has not been validated against emotion annotations, and the models have not been calibrated against each other. A shared plot makes their movement visible, but the distance between the curves is not evidence of emotional disagreement.

The project demonstrates synchronized media interaction, separate text and audio inference, and a visualization that distinguishes saved predictions from display interpolation. Audio, annotation sources, and usage terms are documented in the demo’s [credits](https://nha6ki.github.io/LyriMeloTrace/credits.html) and [data notices](https://github.com/nha6ki/LyriMeloTrace/blob/main/docs/DATA_AND_LICENSES.md).
