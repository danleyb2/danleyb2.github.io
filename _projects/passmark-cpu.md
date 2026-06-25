---
layout: project
title: PassMark CPU Docker Benchmark
date: 2023-10-15
description: Dockerized PassMark CPU benchmark for consistent hardware performance testing.
tags:
  - Docker
  - DevOps
status: Active
is_highlighted: true
github: https://github.com/danleyb2/passmark-cpu
technologies:
  - Docker
  - Linux
---

CPU Performance Test using [PassMark Software](https://www.passmark.com/) running in Docker via `pt_linux`. Provides consistent, repeatable CPU benchmarks in a portable container.

#### Setup
```bash
docker build --tag danleyb2/passmark-cpu .
docker run --rm -t danleyb2/passmark-cpu
```

Outputs structured results including integer math, floating point, prime, sorting, encryption, compression, and single-thread benchmarks alongside system information.
