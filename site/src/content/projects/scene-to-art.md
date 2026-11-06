---
title: "Scene → Art Recommender"
summary: "Predicting individual artwork preferences from photographic aesthetic judgments."
date: "2026-10"
technologies:
  - Python
  - NumPy
  - scikit-learn
  - FastAPI
  - Jinja2
  - JavaScript
  - Bootstrap
  - Docker
  - Google Cloud Run
order: 2
featured: true
image: "/images/projects/scene-to-art.webp"
links:
  - label: "Try the Live Application"
    url: "https://zoe-scene.cloud.run/"
  - label: "Research Lab Announcement"
    url: "https://zoelabo.com/archives/772"
---

## Overview

I developed Scene → Art Recommender at Chikazoe Laboratory, Hiroshima University, to predict individual preferences for paintings based on aesthetic judgments of photographs.

The project is motivated by research on the consistency of aesthetic preferences across visual categories, including paintings, photographs, and faces (Pham & Chikazoe, 2026).

Instead of evaluating paintings directly, users indicate how much they would be willing to pay for six photographs. The system uses these ratings to recommend paintings, present contrasting examples, and provide information about the museums that hold the artworks.

## Recommendation Method

The system uses preference data collected from 37 participants for 400 photographs selected from the AVA (Aesthetic Visual Analysis) dataset.

To select informative photographs, I used leave-one-participant-out cross-validation (LOPO-CV) to evaluate how well each photograph contributes to predicting painting preferences. On each visit, six photographs are randomly selected without replacement from the top 200 candidates.

The recommendation algorithm standardizes the user's ratings and the corresponding ratings from reference participants to compare relative preference patterns. It then uses a radial basis function (RBF) kernel to assign greater weight to participants with similar preferences.

These weights are used to combine precomputed painting-preference predictions from the reference participants, producing personalized scores for approximately 10,000 candidate artworks. The application displays ten highly ranked paintings and ten contrasting examples.

## Development & Implementation

I implemented the recommendation pipeline in Python using NumPy and scikit-learn.

I also developed a bilingual web application using FastAPI, Jinja2, JavaScript, and Bootstrap. The application includes server-side input validation, personalized recommendation results, and museum information.

The service is containerized with Docker and deployed on Google Cloud Run.

## Related Research

Pham, T. Q., & Chikazoe, J. (2026). *Cross domain consistency of aesthetic preference-driven social behavior*. *Frontiers in Neural Circuits, 20*, 1793443.

[Read the paper](https://doi.org/10.3389/fncir.2026.1793443)
