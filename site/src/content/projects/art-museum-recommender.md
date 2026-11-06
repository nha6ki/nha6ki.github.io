---
title: "Art & Museum Recommender"
summary: "Personalized artwork recommendations based on individual aesthetic preferences."
date: "2026-10"
technologies:
  - Python
  - NumPy
  - FastAPI
  - Jinja2
  - JavaScript
  - Bootstrap
  - Docker
  - pytest
  - Google Cloud Run
order: 1
featured: true
image: "/images/projects/art-museum-recommender.jpg"
links:
  - label: "Try the Live Application"
    url: "https://zoe-art.cloud.run/"
  - label: "Research Lab Announcement"
    url: "https://zoelabo.com/archives/735"
---

## Overview

I developed an interactive artwork recommendation system at Chikazoe Laboratory, Hiroshima University, to explore how individual differences in aesthetic preferences can be modeled.

Users indicate how much they would be willing to pay for six paintings. Based on these responses, the system predicts their preferences and presents recommended artworks, contrasting examples, and information about the museums that hold them.

## Recommendation Method

The model uses preference ratings collected from 37 participants for 400 paintings. Principal component analysis (PCA) captures individual differences in a 12-dimensional latent preference space.

Users' ratings are standardized to emphasize relative preferences rather than absolute willingness to pay. Ridge regression then estimates a new user's latent preference representation from six ratings.

The recommendation model combines two approaches with equal weight: predictions based on ridge regression and similarity-weighted predictions derived from cosine similarity to reference participants. The similarity scores are converted into weights using softmax.

The combined model scores approximately 10,000 candidate artworks and presents ten predicted matches alongside ten contrasting examples.

To select the paintings used for preference assessment, leave-one-participant-out cross-validation (LOPO-CV) estimates how informative each artwork is for predicting unseen participants' preferences. On each visit, six paintings are randomly selected without replacement from the top 200 candidates.

<figure class="project-result-figure">
  <a
    href="/images/projects/art-museum-results.png"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="View full-size recommendation results"
  >
    <img
      src="/images/projects/art-museum-results.png"
      alt="Recommendation results displaying ten predicted matches and ten contrasting paintings, with artwork details and museum links."
      loading="lazy"
      decoding="async"
    />
  </a>
  <figcaption>
    Example recommendation results showing predicted matches and contrasting artworks.
  </figcaption>
</figure>

## Development & Implementation

I implemented the recommendation pipeline and developed a bilingual web application using Python, NumPy, FastAPI, Jinja2, and JavaScript.

The application includes input validation, personalized recommendation results, and museum information. It is deployed on Google Cloud Run.
