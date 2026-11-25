---
title: "Economy Watchers · Industry Evidence Explorer"
category: "ai"
summary: "Explore 2,513 Japanese survey responses in a bilingual report that links industry findings to the original comments."
date: "2026-11"
technologies:
  - Gemma 4 12B (QAT)
  - Ollama
  - Python
  - JavaScript
  - GitHub Pages
order: 12
image: "/images/projects/economy-watchers-overview.webp"
imageAlt: "English demo homepage showing the October 2026 survey overview and a chart comparing assessments for current conditions and the outlook."
links:
  - label: "Open the English demo"
    url: "https://nha6ki.github.io/economy-watchers-explorer/"
  - label: "Open the Japanese demo"
    url: "https://nha6ki.github.io/economy-watchers-explorer/ja.html"
  - label: "GitHub repository"
    url: "https://github.com/nha6ki/economy-watchers-explorer"
---

## From Japanese survey responses to an English report

Two respondents can give the same economic assessment for different reasons. I built this bilingual explorer to make those reasons easier to compare and to let readers check an English finding against the original Japanese comment. It covers all 2,513 published reasons in the October 2026 edition of Japan’s Economy Watchers Survey, including current conditions and the outlook. The report groups them by survey section, sector, and industry or occupation, for 412 groups in total. [Cabinet Office survey results](https://www5.cao.go.jp/keizai3/2026/1110watcher/menu.html)

## A supermarket example

One supermarket reported that sales and spending per customer held at year-earlier levels even though shoppers bought fewer items. Another reported that both customer traffic and the number of items sold rose about 2% year on year, lifting sales. The two comments illustrate why a broad sales theme is a starting point for reading the evidence, not a conclusion about the industry. In the demo, find **Three industry examples** and open the supermarket evidence for responses **Current-0350** and **Current-0100**. [Explore the industry examples](https://nha6ki.github.io/economy-watchers-explorer/#:~:text=Three%20industry%20examples)

## Local analysis

I ran Gemma 4 12B (QAT) locally through Ollama to classify themes and produce 618 findings presented in Japanese and English. Each finding links to its source comments by response ID. Readers can filter by survey section, sector, industry or theme, search the Japanese comments, highlight supporting passages, and download an industry workbook.
