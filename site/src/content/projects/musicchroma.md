---
title: "MusicChroma"
category: "ai"
summary: "A music visualization that translates estimated valence and arousal into a changing color gradient synchronized with a historical recording."
date: "2026-11"
technologies:
  - Python
  - Essentia
  - JavaScript
  - HTML Audio
  - Canvas
  - GitHub Pages
order: 7
featured: false
image: "/images/projects/musicchroma.webp"
imageAlt: "MusicChroma’s Experience view at 2:30 in Der Lindenbaum, showing the background gradient and full-song valence and arousal curves."
links:
  - label: "Live Demo"
    url: "https://nha6ki.github.io/MusicChroma/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/MusicChroma"
---

## Listening through color

I built MusicChroma to explore how a recording's estimated emotional character changes over time. The demo follows Schubert's *Der Lindenbaum* (*The Linden Tree*, from *Winterreise*) using the 1933 HU33 recording by Gerhard Hüsch and Hanns-Udo Müller.

The background changes with two estimated dimensions: **valence**, from unpleasant to pleasant, and **arousal**, from calm to activated. The interface is in Japanese.

## Experience and analysis

In **Experience**, a full-screen gradient accompanies playback. Two fixed curves show the full song's estimated valence and arousal; selecting a position on the curves seeks the audio. In **Analysis**, the same player accompanies time-series plots, a two-dimensional color map, and an explanation of the data and method. Both views share playback position and volume.

The two curves represent emotion estimates, not audio amplitude.

## From recording to color

An offline pipeline processes the original recording in overlapping windows of approximately three seconds, advancing by about 1.5 seconds. Essentia's pretrained **MSD-MusiCNN** extracts audio features, and its **DEAM regression head** predicts valence and arousal. The saved series contains 183 points. The browser interpolates between points and synchronizes the result with the audio; inference does not run during playback.

To make changes within the recording visible, the interface scales each dimension using that recording's 10th and 90th percentiles. It maps relative valence to hue and relative arousal to chroma in OKLCH. The background blends colors derived from eight seconds before, the current position, and eight seconds after. The mapping is a visualization design inspired by prior work on emotion and color; it is not a universal conversion.

## Interpretation and limitations

The estimates describe a model's interpretation of the recording, including both voice and piano. They do not measure a listener's feelings or analyze the lyrics. Colors show relative differences within this recording and should not be compared as absolute emotion labels across songs.

The model's accuracy on this performance and the perceptual validity of the palette have not been evaluated. The repository documents the processing pipeline, data provenance, tests, and a known difference between the bundled estimates and a later inference run.

The recording comes from the [Schubert Winterreise Dataset v2.0](https://doi.org/10.5281/zenodo.5139893). The repository distinguishes the project's code license from the conditions attached to third-party audio, models, and dependencies.
