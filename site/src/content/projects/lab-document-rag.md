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

I sometimes remember a figure from a lab meeting but can’t recall which slide it was on. I built a system that lets us search the lab’s Markdown notes and PowerPoint slides in Japanese or English and trace an answer back to a specific line or slide.

The system connects two inference environments we run in the lab. An **AMD Ryzen AI Max+ 395 workstation** indexes the documents and retrieves passages relevant to a question. DeepSeek runs across **two NVIDIA DGX Spark systems** and uses those passages to answer. Researchers can ask a question in Open WebUI and see the answer and its sources together.

![Gemma and Qwen run on the AMD workstation. Retrieved passages go to DeepSeek on two DGX Spark systems.](/images/projects/lab-document-rag.webp)

## Making slide figures searchable

The AMD workstation runs two models through Ollama.

- **Gemma 4 31B** reads slides as images when the index is updated and writes descriptions of their figures. This makes even plots with little extractable text searchable. Each generated description is labeled so readers can distinguish it from the slide author’s own words.
- **Qwen3-Embedding-4B** converts the text extracted from notes and slides, along with Gemma’s descriptions, into vectors. It also embeds each incoming question, so a search can find passages with a similar meaning even when the wording differs.

Qdrant stores each vector alongside its source passage, file path, and line or slide number.

## Answering questions with retrieved passages

When a researcher asks a question in Open WebUI, the AMD workstation retrieves up to four passages from Qdrant and sends them with the question to the local API for **DeepSeek-V4.1-Flash-1017**. TensorFold distributes this single model across the two DGX Spark systems.

Before displaying the answer, the service checks its citation numbers against the retrieved passages. Each source entry points to a line in a Markdown note or a slide in a PowerPoint deck, so researchers can check the passage behind a citation in the original document.

<figure class="project-result-figure" style="max-width: 36rem; margin-inline: auto">
  <a href="/images/projects/lab-rag-workflow.webp" aria-label="Open the full-size indexing and retrieval diagram"><img src="/images/projects/lab-rag-workflow.webp" width="1120" height="1524" loading="lazy" style="display: block; width: 100%; height: auto" alt="During indexing, Qwen embeds native text and Gemma’s slide descriptions in Qdrant. At question time, Qwen embeds the question and the AMD service sends up to four matching excerpts to DeepSeek on two DGX Sparks." /></a>
  <figcaption>Gemma runs during indexing. Qwen embeds both the indexed material and the incoming question.</figcaption>
</figure>

## Related article

[Building a Local RAG System for Lab Notes and Slides with AMD and DGX Spark](https://dev.to/nha6ki/building-a-local-rag-system-for-lab-notes-and-slides-with-amd-and-dgx-spark-42a8)

## Related projects

- [Local LLM Inference on AMD Ryzen AI Max](https://nha6ki.github.io/projects/local-llm-inference-amd-ryzen-ai-max/)
- [Distributed LLM Inference on NVIDIA DGX Spark](https://nha6ki.github.io/projects/distributed-llm-inference-nvidia-dgx-spark/)
