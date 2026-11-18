---
title: "FelisField"
category: "ai"
summary: "Explore 17,303 cat photographs from six sources on a 3D map. Hover over a point or tap it to see the photo, then compare its coat with those of nearby cats."
date: "2026-11"
technologies:
  - Python
  - PyTorch
  - Mask2Former
  - DINOv2
  - UMAP
  - Canvas API
order: 1
image: "/images/projects/felisfield.webp"
imageAlt: "A projection of the FelisField map, with 17,303 points colored by their six visual-feature clusters."
links:
  - label: "Live Demo"
    url: "https://felisfield.pages.dev/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/FelisField"
---

## Finding neighbors by appearance

I built FelisField around a question: if you start with one cat photograph, what will you find a few points away? Drag to rotate the map, or pinch to zoom on a phone. Selecting a point opens the original composition beside it, so you can compare cats without losing your place. Each photo has a separate credit panel with its source and license. The interface is in Japanese.

## How a photograph gets its position

I used Mask2Former to isolate cats in 29,046 candidate photos. When several cats appeared, I used the largest detected cat. For the 17,303 photos that passed the score and size thresholds, I measured the color distribution inside the mask and extracted DINOv2 features from a crop with a uniform background. This keeps a bright sofa or a patch of grass from directly contributing to the coat-color histogram.

The map gives equal weight to the color and DINOv2 features. UMAP places each photograph in three dimensions, and K-means assigns one of six display colors. A point’s color identifies its feature cluster. Coat names such as *tabby* and *calico* are not assigned to these groups.

## What distance tells you

To check whether nearby points have similar colors even across collections, I restricted each photo’s comparison set to other sources. Its 15 closest neighbors on the map had a mean coat-color distance of 0.462, compared with 0.689 for 15 randomly chosen photos, a 33% reduction. The metric measures the same color distribution used to build the map. It describes similarity in color rather than the accuracy of a coat-pattern classifier.

The models run offline. The public site serves precomputed coordinates and loads a JPEG when a visitor selects a point, so exploring the map requires no inference server.
