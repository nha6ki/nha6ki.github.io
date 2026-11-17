---
title: "Notable Musical Patterns"
category: "web"
summary: "A bilingual listening catalogue for exploring musical patterns, comparing excerpts, and tracing the evidence behind each example."
date: "2026-11"
technologies:
  - JavaScript
  - HTML
  - CSS
  - Python
  - GitHub Pages
  - GitHub Actions
order: 4
featured: true
image: "/images/projects/notable-musical-patterns.png"
imageAlt: "The English Notable Musical Patterns homepage with an Alberti bass listening example and a diagram of its four-note pattern."
links:
  - label: "Open the Listening Site"
    url: "https://nha6ki.github.io/notable-musical-patterns/en/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/notable-musical-patterns"
---

## What you can do

I built Notable Musical Patterns for listeners who want to hear what a musical term describes and look up the passage behind the example. The [field guide](https://nha6ki.github.io/notable-musical-patterns/en/guide/) introduces 105 features and observations with explanations, listening cues and references. The homepage, for example, pairs a four-second synthesized excerpt from Kuhlau’s *Sonatina*, Op. 20 No. 1, with a diagram of the Alberti bass pattern: low, high, middle, high.

The published catalogue covers **16 source groups and 6,729 searchable records**, of which **2,983 have in-site audio**. Visitors can compare clips by musical feature or browse individual source collections. The totals count catalogue entries rather than distinct compositions; some entries provide references or external listening links instead of audio on the site.

## How it works

One clip can illustrate several features. I attached representative status to the connection between a clip and a particular feature, not to the clip as a whole. An example with supporting evidence can therefore appear first for one search without being promoted for an unrelated feature. Other matching results remain available.

The Japanese and English interfaces share catalogue records and audio assets while keeping display text separate from stable search keys and card IDs. Switching languages preserves the current filter or guide section. The site runs as static HTML, CSS and JavaScript on GitHub Pages. Python checks and GitHub Actions check counts, links between the two languages, and whether key attribution statements are present before release.

## How the catalogue was built

I started with definitions and passages documented in music-theory sources, then looked across score collections, MIDI, recordings with annotations, and reference catalogues. I kept edition, recording and passage separate when selecting examples. Where the source, excerpt and reuse terms supported on-site audio, I included a short clip. Other entries lead to sources or external recordings rather than hosting the audio. The [collection and selection methodology](https://github.com/nha6ki/notable-musical-patterns/blob/main/METHODOLOGY.md) documents these decisions; the [architecture notes](https://github.com/nha6ki/notable-musical-patterns/blob/main/ARCHITECTURE.md) explain how records and excerpts are joined in the browser.

## Evidence and limits

The site distinguishes what a score or MIDI excerpt shows from what a source annotator or uploader reports. For example, a time signature supplied by an uploader is not presented as an independent analysis of the recording. Each example identifies the relevant source and, where applicable, the edition, excerpt and usage terms. External recordings can be different performances.

The [v1.0.0 release](https://github.com/nha6ki/notable-musical-patterns/releases/tag/v1.0.0) records the bilingual site’s published scope and verification. For reuse, consult the [source-specific terms](https://nha6ki.github.io/notable-musical-patterns/en/datasets/release-notes.html) and the credits on the individual record.
