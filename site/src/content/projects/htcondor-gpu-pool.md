---
title: "An HTCondor Pool for Lab Research Computing"
summary: "I operate an HTCondor pool that lets researchers share the lab’s CPU and GPU workstations. I built the Grafana dashboard they can use to track jobs across the pool."
date: "2026-11"
technologies:
  - HTCondor
  - DAGMan
  - PyTorch
  - MATLAB
  - Python
  - Prometheus
  - Grafana
  - Slack
order: 22
featured: false
image: "/images/projects/htcondor-workstation-pool.webp"
imageAlt: "The HTCondor logo above a submit workstation connected to three lab workstations, one equipped with a GPU."
---

## Shared computing for researchers

Our November 2026 inventory listed **twelve machines**. Researchers can submit a job from their desk, specify the resources it needs, and collect the results on the same machine. I administer the central manager, issue credentials for new workstations, and verify that they can accept jobs. The workstations also serve as desktop computers, so our scheduling policy takes host load into account before starting a new job.

For PyTorch training, we keep Python on shared storage and configure selected NVIDIA workers to let jobs share a physical GPU. For MATLAB analyses, we compile the application on a licensed Linux machine and run it on workers with MATLAB Runtime from our NAS. I documented how researchers can use DAGMan to run a training script with different parameters, limit concurrent submissions, and start a downstream analysis when its inputs are ready.

## A dashboard for researchers and operators

I built a Python exporter for HTCondor and a Grafana dashboard that brings job queues, CPU and memory allocations, and per-GPU memory readings into one view. Prometheus collects the scheduler data alongside measurements from the workstations. Researchers can see where a job landed, while I can check how much capacity a worker is offering and how busy the host is.

The lab’s Slack monitor reports when an expected worker disappears from the pool or a GPU collector stops updating. Each alert names the machine and the failed check so the operator knows where to start.

## Technical publications

I published six guides covering the pool’s setup, research workflows, and day-to-day operation.

1. [Building the Ubuntu pool and running a first remote job](https://dev.to/nha6ki/build-an-htcondor-pool-on-ubuntu-and-run-your-first-remote-job-58b7)
2. [Running PyTorch on shared GPUs](https://dev.to/nha6ki/running-pytorch-jobs-on-shared-gpus-with-htcondor-p96)
3. [Deploying compiled MATLAB applications with MATLAB Runtime](https://dev.to/nha6ki/running-compiled-matlab-jobs-with-htcondor-and-matlab-runtime-25oe)
4. [Managing job dependencies and concurrency with DAGMan](https://dev.to/nha6ki/writing-htcondor-dag-files-job-dependencies-variables-and-concurrency-limits-4anp)
5. [Monitoring jobs and GPU memory with Prometheus and Grafana](https://dev.to/nha6ki/monitoring-htcondor-jobs-and-gpu-memory-with-prometheus-and-grafana-40f6)
6. [Reporting missing workers and stale GPU metrics to Slack](https://dev.to/nha6ki/detecting-missing-htcondor-nodes-and-stale-gpu-metrics-with-prometheus-and-slack-17hm)
