---
title: "Local LLM Inference on AMD Ryzen AI Max"
summary: "A self-hosted LLM environment built on AMD Ryzen AI Max+ 395 for research use, with similar systems deployed to two laboratories."
date: "2026-05"
technologies:
  - AMD Ryzen AI Max+ 395
  - Radeon 8060S
  - Ubuntu
  - ROCm
  - Docker
  - Ollama
  - Open WebUI
  - Gemma 4 31B
order: 4
featured: true
image: "/images/projects/local-llm-inference-architecture.webp"
imageAlt: "System architecture showing researchers accessing Open WebUI and Ollama running Gemma 4 31B on a GMKtec EVO-X2 with AMD ROCm GPU acceleration."
links:
  - label: "DEV.to Article Series"
    url: "https://dev.to/nha6ki/series/46418"
---

## Overview

I built a local large language model (LLM) environment on a **GMKtec EVO-X2** with an AMD Ryzen AI Max+ 395 processor and Radeon 8060S integrated GPU. The system lets researchers use locally hosted language models through a web browser without installing inference software on their own computers.

I also deployed similar environments to **two research laboratories**.

## System Architecture

The EVO-X2 has **128 GB of unified memory**, with **96 GiB reported as GPU memory** in my configuration. The GPU and CPU share physical memory rather than using dedicated graphics memory.

I configured **Ubuntu and AMD ROCm** for GPU acceleration and used **Docker Compose** to run Ollama and Open WebUI in separate containers. Ollama serves the models, while Open WebUI provides the browser interface and user management.

## Implementation

The environment currently uses **Gemma 4 31B** with Q4_K_M quantization. I configured Open WebUI for research-oriented tasks, including long-document workflows, model settings, and account administration.

To keep the intended workflow focused on local inference, I disabled Web Search and unnecessary external integrations in Open WebUI. Local model execution alone does not guarantee network isolation; access also depends on how the host and its services are configured.

## Deployment & Troubleshooting

Deploying and maintaining the environment required attention to ROCm, Ollama, and Linux kernel compatibility. On another EVO-X2, ROCm detected the GPU but Ollama inference failed. Comparing kernel configurations helped restore GPU inference, which I verified through model-layer offloading and successful API responses.

The experience informed how I document and maintain these systems for research use.

## Technical Articles

I documented the setup and related technical work in a three-part DEV.to series:

1. [**Running Ollama on AMD Ryzen AI Max+ 395 with ROCm and Docker**](https://dev.to/nha6ki/running-ollama-on-amd-ryzen-ai-max-395-with-rocm-and-docker-1a3g) — Ubuntu, ROCm, Docker, and GPU inference setup.
2. [**Configuring Gemma 4 31B and Open WebUI for a Research Laboratory**](https://dev.to/nha6ki/configuring-gemma-4-31b-and-open-webui-for-a-research-laboratory-183d) — Model configuration, access management, and document-oriented use.
3. [**Troubleshooting Ollama GPU Inference Failures on AMD Ryzen AI Max**](https://dev.to/nha6ki/troubleshooting-ollama-gpu-inference-failures-on-amd-ryzen-ai-max-2gp) — Diagnosing a kernel-related inference failure.
