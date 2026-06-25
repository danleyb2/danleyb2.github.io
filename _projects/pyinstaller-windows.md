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

## Cross-Platform CI Pipeline

The project also powers a cross-platform installer pipeline using GitHub Actions. Each platform is built independently:

### Windows & Linux (Containerized)

Both use Docker containers to isolate the build environment:

```yaml
jobs:
  windows-installer:
    name: Windows
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Installer
        run: docker run \
          -v $GITHUB_WORKSPACE/docker/platerec_installer:/src/ \
          danleyb2/pyinstaller-windows "pyinstaller platerec_installer.spec -F"
      - uses: actions/upload-artifact@v4
        with:
          name: Windows-Installer-unsigned
          path: docker/platerec_installer/dist

  linux-installer:
    name: Linux
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Installer
        run: docker run \
          -v $GITHUB_WORKSPACE/docker/platerec_installer:/src/ \
          cdrx/pyinstaller-linux "pyinstaller platerec_installer.spec -F"
      - uses: actions/upload-artifact@v4
        with:
          name: PlateRecognizer-Installer-Linux
          path: docker/platerec_installer/dist/PlateRecognizer-Installer
```

Windows builds inside the `danleyb2/pyinstaller-windows` container; Linux uses `cdrx/pyinstaller-linux`. Both mount the source directory and output to `dist/`.

### macOS (Native)

macOS runs natively since there's no equivalent cross-platform Docker image:

```yaml
  mac-installer:
    runs-on: macos-latest
    name: MacOS
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: 3.8.10
      - name: Build Installer
        run: |
          cd docker/platerec_installer
          pip install --upgrade pip
          pip install -r requirements.txt pyinstaller==6.15.0
          pyinstaller platerec_installer.spec
          chmod -R +x dist
      - uses: actions/upload-artifact@v4
        with:
          name: PlateRecognizer-Installer-MacOS
          path: docker/platerec_installer/dist/*
```

### Windows Smoke Test

After building, the installer is validated on a real Windows runner:

```yaml
  test-windows-installer:
    runs-on: windows-latest
    needs: windows-installer
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: Windows-Installer-unsigned
          path: dist
      - name: Test local API
        run: |
          cmd /c "START /b dist\PlateRecognizer-Installer.exe"
          ping 127.0.0.1 -n 6 > nul
          netstat -o -n -a | findstr 8050
          curl -X GET "http://localhost:8050"
```

This starts the installer in the background, waits for it to expose port 8050, then hits its local API endpoint. Anything that fails kills the build.
