---
title: "Lab Document RAG on AMD and NVIDIA DGX Spark"
category: "ai"
summary: "Gemma and Qwen make lab notes and slide figures searchable on AMD. DeepSeek on two DGX Sparks answers questions with references to the original files."
date: "2026-11"
technologies:
  - Python
  - Qdrant
  - Qwen3-Embedding-4B
  - Gemma 4 31B
  - Ollama
  - AMD Ryzen AI Max+ 395
  - DeepSeek-V4.1-Flash-1017
  - NVIDIA DGX Spark
  - Open WebUI
featured: false
order: 40
image: "/images/projects/lab-document-rag.webp"
imageAlt: "On AMD, Gemma 4 31B describes slides and Qwen3-Embedding-4B embeds documents and queries. DeepSeek-V4.1-Flash-1017 uses retrieved passages to answer on two DGX Sparks."
---

[日本語で読む](/projects/lab-document-rag/ja/)

## From two inference systems to one lab assistant

A researcher looking for a procedure may remember the figure that explained it but forget which slide deck contained it. I connected two systems I had built for the lab to make those materials searchable from Open WebUI. The AMD workstation prepares and retrieves evidence from our Markdown notes and PowerPoint decks. The distributed DeepSeek service uses that evidence to answer in Japanese or English. Each source entry gives the file path and a line or slide number so the researcher can check the original.

## How a slide becomes evidence

On the **AMD Ryzen AI Max+ 395**, Ollama serves two models. **Gemma 4 31B** describes rendered slides so that plots with little extractable text have a searchable description. **Qwen3-Embedding-4B** embeds both these descriptions and the text extracted directly from the documents. I store the passages, vectors and source locations together in Qdrant. Generated descriptions carry a label so a reader can distinguish a caption from text written by the slide’s author.

When a researcher asks a question, Qwen embeds it and Qdrant retrieves up to four passages. The AMD service sends the question and excerpts to the local API for **DeepSeek-V4.1-Flash-1017**. TensorFold runs that single model across **two NVIDIA DGX Sparks**. The service checks the returned citation IDs and appends the source locations to the answer in Open WebUI.

<figure class="project-result-figure" style="max-width: 36rem; margin-inline: auto">
  <a href="/images/projects/lab-rag-workflow.webp" aria-label="Open the full-size indexing and retrieval diagram"><img src="/images/projects/lab-rag-workflow.webp" width="1120" height="1524" loading="lazy" style="display: block; width: 100%; height: auto" alt="During indexing, Qwen embeds native text and Gemma’s slide descriptions in Qdrant. At question time, Qwen embeds the question and the AMD service sends up to four matching excerpts to DeepSeek on two DGX Sparks." /></a>
  <figcaption>Gemma runs during indexing. Qwen embeds both the indexed material and the incoming question.</figcaption>
</figure>

## Related article

[Building a Local RAG System for Lab Notes and Slides with AMD and DGX Spark](https://dev.to/nha6ki/building-a-local-rag-system-for-lab-notes-and-slides-with-amd-and-dgx-spark-42a8)

## Related projects

- [Local LLM Inference on AMD Ryzen AI Max](https://nha6ki.github.io/projects/local-llm-inference-amd-ryzen-ai-max/)
- [Distributed LLM Inference on NVIDIA DGX Spark](https://nha6ki.github.io/projects/distributed-llm-inference-nvidia-dgx-spark/)
