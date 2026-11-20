---
title: "Cat Behavior & Collar Sensor Signals"
category: "web"
summary: "Watch 12 cats’ annotated behaviors alongside synchronized traces from their collar accelerometers."
date: "2026-11"
technologies:
  - JavaScript
  - Canvas
  - R
  - GitHub Pages
order: 10
featured: true
image: "/images/projects/cat-behavior-collar-signals.webp"
imageAlt: "Three illustrated cats in different poses, each beneath a trace from its collar accelerometer."
links:
  - label: "Open interactive demo"
    url: "https://nha6ki.github.io/Cat-Behavior-and-Collar-Sensor-Signals/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/Cat-Behavior-and-Collar-Sensor-Signals"
---

What does a collar sensor record while a cat walks, sits or grooms? This browser demo pairs a short animation of each observed behavior with the movement signal recorded in the same second. Select a cat to inspect its original behavior label, UTC timestamp and sensor values.

## How the replay works

I matched the collar recordings and behavior annotations by cat and timestamp, then selected one continuous segment per animal. Together the 12 segments cover 11,578 seconds. Each cat starts at the beginning of its own segment and loops independently. Its path across the screen is illustrative.

The cyan trace shows the last 15 seconds of collar activity (ODBA15_Mean). All cats share a logarithmic vertical scale so that small movements remain visible alongside larger peaks. The detail panel reports the original values. You can switch between English and Japanese and replay the recordings at up to ten times their original speed.

## Data source

The demo uses selected segments of Michelle Smit’s 2023 [behavior annotations and accelerometer data](https://doi.org/10.6084/m9.figshare.23605842.v2), distributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
