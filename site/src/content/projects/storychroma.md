---
title: "StoryChroma"
summary: "An interactive Japanese audiobook that synchronizes narration, text, and dynamic color visualization of model-estimated emotions."
date: "2026-11"
technologies:
  - React
  - TypeScript
  - Vite
  - Python
  - PyTorch
  - Hugging Face Transformers
  - VOICEVOX
  - Canvas 2D
  - OKLab
order: 2
featured: true
image: "/images/projects/storychroma-experience.webp"
imageAlt: "StoryChroma Experience interface showing synchronized Japanese literary text over a dynamic multicolor emotion gradient."
links:
  - label: "Live Demo"
    url: "https://nha6ki.github.io/StoryChroma/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/StoryChroma"
---

## Overview

StoryChroma is an interactive Japanese audiobook that synchronizes literary text, synthesized narration, and a continuously changing color visualization based on estimated emotions.

The current application features *Gongitsune* (ごん狐) by Nankichi Niimi, using 168 text segments and approximately 15 minutes and 33 seconds of narration. It is available as a browser-based demonstration.

## Emotion Visualization

I used a Japanese BERT model fine-tuned on WRIME to estimate eight emotion dimensions for each sentence: joy, sadness, anticipation, surprise, anger, fear, disgust, and trust.

StoryChroma visualizes the model's **Reader-side predictions**: estimates of emotions a reader might attribute to the writer, not emotions experienced by readers themselves. These outputs are not ground-truth labels for the literary work.

The visualization combines all eight dimensions rather than displaying only the highest-scoring emotion. Emotion colors are arranged at fixed spatial positions, combined using Gaussian spatial weighting and OKLab color mixing, and interpolated between sentence midpoints to produce continuous transitions synchronized with narration.

## Interactive Experience

The application offers two complementary views:

- **Experience:** A reading and listening interface with a full-screen animated color field, synchronized text highlighting, and audio controls.
- **Analysis:** Sentence-level emotion scores, a full-story emotion heatmap, a dominant-emotion timeline, a color visualization, and the complete text with sentence navigation.

Users can seek to a sentence, change playback speed, and switch views without restarting narration. Both views share the same playback state.

## Implementation

I built the interface with React, TypeScript, Vite, HTML Audio, and Canvas 2D. The offline preparation pipeline uses Python, PyTorch, and Hugging Face Transformers for emotion inference and VOICEVOX ENGINE for speech synthesis. Sentence timestamps are derived from accumulated audio sample counts.

The deployed application uses precomputed emotion data and MP3 narration, so it runs as a static website on GitHub Pages without an inference server. The GitHub repository provides the source code, technical documentation, reproduction instructions, and artifact validation tests.

## Screenshots and Demo

### Analysis View

The Analysis interface provides an overview of emotion estimates across the story, including sentence-level scores, an emotion heatmap, and a dominant-emotion timeline.

<a href="/images/projects/storychroma-analysis.webp" target="_blank" rel="noopener noreferrer">
  <img
    src="/images/projects/storychroma-analysis.webp"
    alt="StoryChroma Analysis interface"
    loading="lazy"
    style="display:block;width:100%;max-width:480px;height:auto;margin:1rem auto;border-radius:10px;"
  />
</a>

### Demo Video

A short demonstration of synchronized narration, dynamic emotion visualization, and navigation between the Experience and Analysis views.

<video controls muted loop playsinline preload="metadata" poster="/images/projects/storychroma-experience.webp" style="display:block;width:100%;max-width:960px;height:auto">
  <source src="/videos/storychroma-demo.mp4" type="video/mp4" />
  <a href="/videos/storychroma-demo.mp4">Watch the demonstration video</a>
</video>

## Limitations

The emotion estimates are model outputs, not measurements of the author's actual emotions or readers' emotional experiences. The model was trained on Japanese social media text, and its performance on literary prose has not been independently validated for this project.

The color mapping and its effects on reading comprehension or emotional engagement have not been evaluated in a user study. StoryChroma is presented as a working visualization prototype, not a validated method for interpreting literary emotion.
