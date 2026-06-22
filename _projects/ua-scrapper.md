---
layout: project

title: UA-Scrapper

date: 2023-11-03
description: A starter template for PHP projects.

tags:
  - Puppeteer
  - JS
  - API
  - Docker
  
status: Active

github: https://github.com/salesleadgen/ua-scrapper

technologies:
  - JS
  - Puppeteer
  - Docker

is_highlighted: true

---

Scrape the latest list of browser User Agents from [Tech Blog](https://techblog.willshouse.com/2012/01/03/most-common-user-agents/) and expose as an API. 

Scrapping uses Puppeteer to bypass Cloudflare's anti-bot protection.


### Build Docker image
```sh 
docker build --tag ua-scrapper .
```

### Run Image
```sh
docker run --init --cap-add=SYS_ADMIN --rm  -p 3000:3000 -it ua-scrapper

# docker run -i --init --cap-add=SYS_ADMIN --rm ghcr.io/puppeteer/puppeteer:latest node -e "$(cat path/to/script.js)"

docker run  --name=ua-scrapper --network=lsns -d --init --cap-add=SYS_ADMIN -p 3000:3000 --rm -it ua-scrapper

```

