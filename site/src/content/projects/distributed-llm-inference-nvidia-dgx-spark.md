---
title: "Distributed LLM Inference on NVIDIA DGX Spark"
summary: "Deployed DeepSeek-V4.1-Flash-1017 across two NVIDIA DGX Spark systems, with a local API, browser access, and documented PDF evaluation."
date: "2026-11"
technologies:
  - NVIDIA DGX Spark
  - DeepSeek-V4.1-Flash-1017
  - TensorFold
  - RoCE
  - NFS
  - Docker
  - Open WebUI
order: 21
featured: true
image: "/images/projects/distributed-llm-inference-nvidia-dgx-spark.webp"
imageAlt: "Flat illustration of two DGX Spark systems connected for distributed DeepSeek inference, with Open WebUI on the worker and an API server on the head."
links:
  - label: "Implementation (DEV.to)"
    url: "https://dev.to/nha6ki/running-deepseek-v41-flash-1017-across-two-nvidia-dgx-sparks-5hk9"
  - label: "Evaluation (DEV.to)"
    url: "https://dev.to/nha6ki/evaluating-deepseek-v41-flash-1017-on-a-60-page-pdf-what-text-extraction-misses-2efo"
  - label: "Evaluation Materials (GitHub)"
    url: "https://github.com/nha6ki/deepseek-v4.1-flash-evaluation"
---

## Overview

I deployed **DeepSeek-V4.1-Flash-1017** across two NVIDIA DGX Spark systems for local LLM access in a research laboratory. The environment provides an OpenAI-compatible API and a browser interface through Open WebUI.

## System Architecture

TensorFold runs distributed inference across both DGX Sparks using **tensor parallelism (TP=2)**. The head runs rank 0 and serves the API; the worker runs rank 1 and hosts Open WebUI. Two ConnectX-7 RoCE links support inter-node communication, and a read-only NFS export provides access to shared model files.

The deployment uses an **EXL3 EAQ v1 checkpoint at 2.9 bpw**. I configured a **262,144-token context** and **one concurrent inference stream** for the tested setup. These are serving settings, not independently established limits of reliable context understanding or concurrency.

## Implementation

I configured the network links, NFS access, model preparation, and Docker-based inference environment. I verified startup and shutdown on both nodes, authenticated API requests, Japanese text generation, and access through Open WebUI on the laboratory network.

The web interface also supports PDF attachment workflows and user accounts. Detailed configuration, commands, and operating procedures are documented in the implementation article.

## Evaluation

I evaluated document question answering with **ASTER-47**, a fictional 60-page English report created specifically for testing. In one combined PDF-chat test, the model matched the prepared answer key for **20/20 text and table questions** and withheld answers to five raster-only figure questions. In five separate chats where the figures were uploaded directly as PNGs, **5/5 answers matched the key**.

The original prompts and responses are preserved in the evaluation repository. The two input conditions used different question procedures, so these observations are **not a controlled model-accuracy benchmark**. The evaluation article describes the evidence and limitations in detail.

## Technical Articles and Evaluation Data

- [**Implementation — Running DeepSeek-V4.1-Flash-1017 Across Two NVIDIA DGX Sparks**](https://dev.to/nha6ki/running-deepseek-v41-flash-1017-across-two-nvidia-dgx-sparks-5hk9)
- [**Evaluation — Evaluating DeepSeek-V4.1-Flash-1017 on a 60-Page PDF**](https://dev.to/nha6ki/evaluating-deepseek-v41-flash-1017-on-a-60-page-pdf-what-text-extraction-misses-2efo)
- [**ASTER-47 evaluation materials and recorded responses (GitHub)**](https://github.com/nha6ki/deepseek-v4.1-flash-evaluation)
