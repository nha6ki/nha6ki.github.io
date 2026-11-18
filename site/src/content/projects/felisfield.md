---
title: "FelisField"
category: "ai"
summary: "A 3D map of 17,303 cat photographs from six sources. Explore how coat color and other visual features vary from one point to the next."
date: "2026-11"
technologies:
  - Python
  - PyTorch
  - Mask2Former
  - DINOv2
  - UMAP
  - Canvas API
order: 1
featured: true
image: "/images/projects/felisfield.webp"
imageAlt: "A cloud of points in six colors, each point representing one cat photograph."
links:
  - label: "Live Demo"
    url: "https://felisfield.pages.dev/"
  - label: "GitHub"
    url: "https://github.com/nha6ki/FelisField"
---

## Explore the map

Hover over a point or tap it to see the full photograph beside it. Try a neighboring point to compare the cats’ coats, or drag to rotate the map and explore another group. On a phone, pinch to zoom. The demo is in Japanese, and a separate panel lists the source and license for the selected photo.

## How the map is built

I ran Mask2Former on 29,046 candidate photos and kept the 17,303 that met the detection score and minimum area thresholds. For photos with multiple detected cats, I used the largest predicted cat region. I measured the distribution of colors inside that region and used DINOv2 to extract visual features from a crop with the surrounding background masked out.

I gave the two sets of features equal weight. UMAP uses the combined features to position each photo in three dimensions. K-means uses the same features to group the photos into six clusters. The six point colors identify these clusters without assigning coat-pattern names.

The models run offline. The browser loads the precomputed map and fetches each preview as you explore.

## How similar are neighboring coats?

For each photo, I compared its 15 nearest neighbors on the map with 15 randomly chosen photos. Both sets came from sources other than the photo’s own. I measured the difference between coat-color distributions using Hellinger distance, where smaller values indicate more similar colors.

The average distance was **0.462 for map neighbors** and **0.689 for random selections**, about 33% lower for neighbors. This checks how well the 3D layout preserves one of its inputs, coat color. Recognizing patterns such as tabby or calico is a separate question.
