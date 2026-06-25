---
layout: project
title: UA-Scrapper
date: 2023-11-03
description: Puppeteer-powered browser user agent scraper with Cloudflare bypass, exposed as a Dockerized API.
tags:
  - Puppeteer
  - JS
  - Docker
status: Active
is_highlighted: true
github: https://github.com/salesleadgen/ua-scrapper
technologies:
  - JavaScript
  - Puppeteer
  - Docker
---

Scrape the latest list of browser User Agents from Tech Blog and expose as an API. Scrapping uses Puppeteer to bypass Cloudflare's anti-bot protection.

#### Build & Run
```sh 
docker build --tag ua-scrapper .
docker run --init --cap-add=SYS_ADMIN --rm -p 3000:3000 -it ua-scrapper
```
