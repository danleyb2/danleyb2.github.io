---
layout: project

title: PassMark CPU
date: 2023-10-15
description: CPU Perfomance Test

tags:
  - Docker
  
status: Active

github: https://github.com/danleyb2/passmark-cpu

technologies:
  - Docker
  - Devops

is_highlighted: true

---

CPU Performance Test using [Passmark Software](https://www.passmark.com/) running in docker using [pt_linux](https://www.passmark.com/products/pt_linux/index.php) 

### Setup

Build the image
 ```bash
 docker build --tag danleyb2/passmark-cpu .
 ```

Run Image
 ```bash
 docker run --rm -t danleyb2/passmark-cpu
 ```

Example output
 ```yml
 Running CPU Test ...
 /dev/mem: No such file or directory
 BaselineInfo:
     WebDBID: -1
     TimeStamp: 20240324100445
 Version:
     Major: 11
     Minor: 0
     Build: 1002
     SpecialBuildName: ""
     ptArchitecture: x86_64_linux
 Results:
     Results Complete: true
     NumTestProcesses: 20
     CPU_INTEGER_MATH: 84506.756000000023
     CPU_FLOATINGPOINT_MATH: 51738.892392791204
     CPU_PRIME: 50.031707503031271
     CPU_SORTING: 40743.358856466402
     CPU_ENCRYPTION: 11090.015936906177
     CPU_COMPRESSION: 358675.06388255506
     CPU_SINGLETHREAD: 3244.6921381739521
     CPU_PHYSICS: 898.6848526467478
     CPU_MATRIX_MULT_SSE: 17440.157133678196
     CPU_mm: 2220.1433150635876
     CPU_sse: 8568.8187698306265
     CPU_fma: 25510.723688987538
     CPU_avx: 18240.928942216426
     CPU_avx512: 0
     m_CPU_enc_SHA: 3633933270.5894885
     m_CPU_enc_AES: 28047006417.552082
     m_CPU_enc_ECDSA: 3205233965.0304213
     ME_ALLOC_S: 0
     ME_READ_S: 0
     ME_READ_L: 0
     ME_WRITE: 0
     ME_LARGE: 0
     ME_LATENCY: 0
     ME_THREADED: 0
     SUMM_CPU: 22360.664847702054
     SUMM_ME: 0
 SystemInformation:
     OSName: Ubuntu 20.04.6 LTS
     Kernel: 6.1.80-1-MANJARO
     Device: ""
     Processor: Intel Core i9-10900F CPU @ 2.80GHz
     NumSockets: 1
     Manufacturer: GenuineIntel
     NumCores: 10
     NumLogicals: 20
     CPUFrequency: 5200
     Memory: 29690
     MemModuleInfo:
         iNumMemSticks: 0
 Checksum: 41C01922DA0512A9003C24C335CE002F09ABD1CE%      
 ```