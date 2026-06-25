---
layout: project

title: PyInstaller Windows
date: 2021-04-20
description: Dockerized Windows binaries built with PyInstaller for Python apps

tags:
  - Docker
  - PyInstaller
  - Python
  - CI/CD
  
status: Active

docker: https://hub.docker.com/repository/docker/danleyb2/pyinstaller-windows

technologies:
  - Docker
  - PyInstaller
  - Python
  - Windows

is_highlighted: false

---

A Docker-based build system for compiling Python applications into standalone Windows executables using **PyInstaller**. Runs PyInstaller builds inside a clean Windows container, avoiding the need for native Windows build machines or WSL workarounds.

### Why It Exists

PyInstaller requires a matching OS to produce working binaries — you compile `.exe` files on Windows, `.dmg` on macOS, etc. This image gives you consistent, reproducible Windows builds from any environment (Linux CI, Mac, etc.) without needing an actual Windows box.

### Usage

```bash
docker pull danleyb2/pyinstaller-windows:latest
```

The image includes PyInstaller, all common Python dependencies, and a build pipeline that outputs standalone `.exe` files ready for distribution.

### Stats

- **Pulls:** 486+
- **Architecture:** amd64 / Linux
- **Image size:** ~802 MB
- **First built:** April 2021
