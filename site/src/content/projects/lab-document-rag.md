---
title: "Local RAG for Lab Notes and Slides on AMD and NVIDIA DGX Spark"
categories: ["ai"]
summary: "Search lab notes and slide figures in Japanese or English, then follow a citation to the original line or slide."
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
featured: true
order: 40
image: "/images/projects/lab-document-rag.webp"
imageAlt: "On AMD, Gemma 4 31B describes slides and Qwen3-Embedding-4B embeds documents and queries. DeepSeek-V4.1-Flash-1017 uses retrieved passages to answer on two DGX Sparks."
---

I sometimes remember a figure from a lab meeting but forget which slide deck it came from. I built a local retrieval-augmented generation (RAG) system so we can ask questions about our Markdown notes and PowerPoint slides in Japanese or English and find the source of an answer.

The **AMD Ryzen AI Max+ 395 workstation** indexes the documents and retrieves relevant passages. DeepSeek runs across **two NVIDIA DGX Spark systems** and uses those passages to answer. Open WebUI shows the answer and its sources together.

<a href="/images/projects/lab-document-rag.webp" style="display:block;max-width:44rem;margin:1.5rem auto"><img src="/images/projects/lab-document-rag.webp" width="1280" height="720" style="display:block;width:100%;height:auto" alt="Gemma and Qwen run on the AMD workstation, which sends retrieved passages to DeepSeek on two DGX Spark systems." /></a>

## Making slide figures searchable

A text extractor may capture a chart’s title but miss the figure itself. Two models running through Ollama on the AMD workstation make that content searchable:

- **Gemma 4 31B** describes figures from rendered slides during indexing. The index labels each description as AI-generated so readers can distinguish it from the slide author’s text.
- **Qwen3-Embedding-4B** embeds both the document text and Gemma’s descriptions. It embeds questions in the same vector space, so a question and a relevant passage can use different words.

Qdrant stores each vector with the passage it represents, the file path, and the starting line or slide number.

<figure class="project-result-figure" style="width:min(100%,38rem);margin:1.5rem auto"><a href="/images/projects/lab-rag-workflow.webp"><img src="/images/projects/lab-rag-workflow.webp" width="1120" height="680" loading="lazy" alt="Extracted text and Gemma’s figure descriptions both feed into Qwen. Qdrant stores the resulting vectors with their passages and source locations." /></a><figcaption>Both paths preserve the location of the original line or slide.</figcaption></figure>

## Answering questions with retrieved passages

For each question in Open WebUI, the AMD workstation retrieves up to four passages from Qdrant and sends them with the question to the local API for **DeepSeek-V4.1-Flash-1017**. TensorFold runs that single model across both DGX Spark systems.

The service checks the citation IDs it recognizes in the answer against the IDs it sent to DeepSeek. The source list includes every passage supplied to the model, even if the answer doesn’t cite it. Researchers can open a note at the listed line or return to the original slide to check a chart’s legend or values.

## Related article

[Building a Local RAG System for Lab Notes and Slides with AMD and DGX Spark](https://dev.to/nha6ki/building-a-local-rag-system-for-lab-notes-and-slides-with-amd-and-dgx-spark-42a8)

## Related projects

- [Local LLM Inference on AMD Ryzen AI Max](https://nha6ki.github.io/projects/local-llm-inference-amd-ryzen-ai-max/)
- [Distributed LLM Inference on NVIDIA DGX Spark](https://nha6ki.github.io/projects/distributed-llm-inference-nvidia-dgx-spark/)
