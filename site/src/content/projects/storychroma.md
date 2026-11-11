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

StoryChroma is an interactive audiobook that combines Japanese literary text, synthesized narration, and dynamic color visualization based on estimated emotions.

The current implementation features *Gongitsune* (ごん狐) by Nankichi Niimi, with 168 text segments and approximately 15 minutes and 33 seconds of synthesized narration.

## Emotion Visualization

I used a Japanese BERT model fine-tuned on the WRIME dataset to estimate eight emotion dimensions for each sentence: joy, sadness, anticipation, surprise, anger, fear, disgust, and trust.

The visualization uses the model's Reader-side predictions, which estimate the writer's emotions from the text rather than measuring the emotions experienced by readers.

Instead of displaying only the highest-scoring emotion, StoryChroma combines all eight dimensions into a spatial color field. The visualization uses a fixed arrangement of emotion colors, Gaussian spatial weighting, and OKLab color mixing.

Emotion scores are interpolated between sentence midpoints to produce continuous color transitions synchronized with the narration timeline.

## Interactive Experience

The application provides two complementary interfaces:

- **Experience:** A full-screen animated color gradient with synchronized text highlighting and audiobook playback controls.
- **Analysis:** Eight-dimensional emotion scores, a full-story emotion heatmap, a dominant-emotion timeline, and sentence-level navigation.

Both interfaces share the same playback state. Users can seek between sentences, adjust playback speed, and switch views without restarting the narration.

## Implementation

I developed the web application using React, TypeScript, Vite, HTML Audio, and Canvas 2D.

The data preparation pipeline uses Python, PyTorch, and Hugging Face Transformers for emotion inference, while VOICEVOX ENGINE generates sentence-level narration. Sentence timestamps are derived from the accumulated audio sample counts during synthesis.

The published application uses precomputed emotion predictions and narration audio, allowing it to run as a static website on GitHub Pages without a dedicated inference server.

The repository also includes technical documentation, artifact validation tests, and instructions for reproducing the processing pipeline.

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

The emotion scores are model estimates, not ground-truth representations of the story's emotions. The model was trained on Japanese social media text, and its accuracy for literary text has not been independently validated.

The color assignments and their interpretation have not been evaluated through a user study. StoryChroma is presented as a working visualization prototype rather than a validated method for improving literary comprehension or emotional engagement.
