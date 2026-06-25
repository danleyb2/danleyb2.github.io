---
layout: post
title:  Building Desktop GUIs with Docker Extensions for Python Tools
date:   2026-06-25 14:00:00 +0300
categories: [Docker, PyInstaller, DesktopGUI, Python]
is_highlighted: false
---

For years, the go-to way to ship a Python desktop app has been clear: build your GUI in whatever framework makes sense, then bundle it with **PyInstaller** into a standalone binary. It works. But it's also a fragile process — dependency hell, platform-specific quirks, and binaries that grow to 50MB+ for what should be a simple script.

Enter **Docker Desktop Extensions**.

They let you build desktop-quality GUIs using modern web tech (React, Vue, whatever), run the heavy lifting in containers, and distribute them through Docker's official ecosystem. No compilers, no cross-platform headaches, just `docker compose up` under the hood.

## Why This Matters for Python Tooling

Many of the tools we build are CLI-first by nature. Plate recognition pipelines, data processing workflows, monitoring dashboards — they're all perfectly fine from a terminal. But when you hand them to non-technical stakeholders, or try to demo them at a conference, "run this script" is not enough.

The traditional path:
1. Wrap the CLI in **Gooey** or **tkinter**
2. Install dependencies into a clean venv
3. Run `pyinstaller --onefile` and pray
4. Test on Windows, macOS, Linux separately
5. Maintain three installer chains forever

Here's what that traditional path actually looks like:

```python
# detect.py - A simple plate recognition CLI wrapped in Gooey
from gooey import Gooey, GooeyParser
import subprocess
import os

@Gooey(
    program_name="Plate Recognizer",
    description="Upload an image and get license plate data back"
)
def main():
    parser = GooeyParser()
    parser.add_argument("image", widget="FileDialog", help="Input image file")
    args = parser.parse_args()

    result = subprocess.run(
        ["python", "recognize.py", args.image],
        capture_output=True, text=True
    )
    print(result.stdout)

if __name__ == "__main__":
    main()
```

Then build it:
```bash
pip install gooey pyinstaller
pyinstaller --onefile --windowed detect.py
```

That's the whole process. One command for the GUI, one command for the binary.

**What works about this:**
- Gooey auto-generates a window with file pickers, text outputs, etc. from your function signature
- PyInstaller bundles everything into a single `.exe` on Windows or a binary on macOS/Linux
- Works offline, no Docker required

**What doesn't work about this:**
- The generated EXE is ~40-80MB even for trivial scripts (all of Python + stdlib bundled)
- Windows antivirus will flag it as suspicious 70% of the time
- macOS Gatekeeper rejects unsigned binaries instantly
- Linux requires matching glibc versions or it won't run at all
- Every dependency update means rebuilding on every platform
- No built-in way to handle large models (onnx, torch, etc.) — they have to fit in your binary

Compare that to the Docker path: your Python tool stays in a lean container image, only ~300MB for heavy ML workloads, and runs identically everywhere Docker is installed.

The Docker Extensions path:
1. Build a web-based GUI
2. Wrap the CLI in a container
3. Publish to Docker Hub
4. Users run `docker extension install yourname/app`

One codebase. One binary. Every platform that runs Docker.

## Docker Desktop Extension Architecture

A Docker Desktop Extension is deceptively simple. It's composed of two main parts:

### The UI (Companion App)

A web app — typically React, Vue, or Svelte — that renders inside a dedicated browser window in Docker Desktop. It communicates with the backend through **Docker's extension SDK**, which exposes a JavaScript API for container management, CLI execution, and state sharing.

### The Backend

A container (or `docker-compose` stack) that runs your actual tooling. For Python workloads, this is where PyInstaller binaries live, where heavy ML models are loaded, where Docker-in-Docker pipelines execute. The UI is just the window; the backend does the work.

The extension manifests tie them together:

The extension manifests tie them together:
```json
{
  "desktop": {
    "companion": {
      "start": ["docker", "compose", "-f", "docker-compose.yml", "up"],
      "stop": ["docker", "compose", "-f", "docker-compose.yml", "down"]
    },
    "windows": [
      {
        "title": "My Tool",
        "startCommands": ["docker compose -f docker-compose.yml up ui"],
        "frontend": { "port": 3000, "path": "/" }
      }
    ]
  },
  "integration": {
    "cli": {
      "exec": {
        "name": "mytool",
        "command": "docker exec mytool-app mytool-cli"
      }
    }
  }
}
```

This gives you:
- **Auto-lifecycle**: Docker starts/stops your backend when the extension launches
- **CLI injection**: Your tool becomes available in any terminal as `mytool` without installing anything globally
- **State sharing**: Backend writes to `$HOME/.docker/desktop-ext/mytool/data/`, accessible by the frontend via API

## Building One: The Practical Flow

### 1. Backend — Containerize your Python tool

```dockerfile
FROM python:3.12-slim
RUN pip install --no-cache-dir plate-recognition-sdk flask
COPY . /app
WORKDIR /app
ENTRYPOINT ["python", "app.py"]
```

No PyInstaller needed. The container *is* the runtime.

### 2. Frontend — Web UI with Docker SDK

Using the official Docker Desktop Extension SDK:

```jsx
import { Client } from '@docker/extension-api-client'

const client = new Client()

async function runDetection(imagePath) {
  const result = await client.docker.exec.run({
    containerName: 'app-backend',
    cmd: ['python', 'detect.py', imagePath]
  })
  return JSON.parse(result.stdout)
}
```

The `@docker/extension-api-client` package is the bridge between your React/Vue UI and Docker Desktop's internals.

### 3. Extension Manifest

Place `extension.toml` or `docker-extension.json` in the root of your project. This file declares what Docker Desktop sees when a user installs your extension — window titles, icons, CLI bindings, permissions.

### 4. Packaging & Publishing

```bash
# Build the extension bundle
docker buildx build -t myname/myextension:0.1.0 .

# Push to Docker Hub
docker push myname/myextension:0.1.0

# Local install for testing
docker extension install myname/myextension:0.1.0 --target docker-desktop
```

Users then install it from the command line or Docker Desktop's Extensions marketplace. No websites, no click-through installer wizards, no antivirus flags on PyInstaller binaries.

## When This Makes Sense (and When It Doesn't)

**Good fit:**
- Python tools that need a GUI for demos, stakeholder access, or non-technical users
- Tools with ML models, heavy dependencies, or Docker-native workflows
- Distribution across macOS and Windows without managing native installers
- Internal team tooling where Docker Desktop is already installed

**Not a fit if:**
- You need system-level integrations (file watchers, kernel modules)
- Your audience won't have Docker Desktop installed
- The tool is genuinely simple enough for Gooey + PyInstaller in an afternoon

## Comparison: Dagster & Prefect

It's worth noting this pattern isn't new. Both **Dagster** and **Prefect** ship desktop GUIs using the same split architecture: web frontend + backend container, distributed as desktop applications. The Docker Extensions format just makes that pattern official, standardized, and first-class in Docker Desktop rather than a hack you assemble from third-party wrappers.

The advantage is ecosystem integration — your extension can appear in Docker Desktop's sidebar, hook into container logs automatically, share state with other extensions, and get installed through the same mechanism as any other Docker tool.

## Final Thoughts

PyInstaller isn't going away — it works for what it does. But if you're building Python tools that need a GUI and you're already comfortable with containers, Docker Desktop Extensions save an enormous amount of pain. One build, every platform, real dependency isolation, and an installation process that doesn't look like malware from 2014.

The future of desktop Python tooling might not be native binaries at all — it might be `docker run` wearing a React face.

