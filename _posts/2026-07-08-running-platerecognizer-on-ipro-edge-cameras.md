---
layout: post
title:  "Running PlateRecognizer on i-PRO Edge Cameras with the ADAM Framework"

date:   2026-07-08 10:46:00 +0300

categories: [VisionAI, EmbeddedAI, Docker, Python, Cpp, EdgeComputing, CameraSDK]

is_highlighted: true
---

At PlateRecognizer, we've shipped detection in browsers, Docker containers, and cloud APIs. But the edge case that keeps engineers awake at 2 AM is always the same: **running on hardware with no network, limited memory, and a locked-down firmware.**

Recently I worked on getting our stream pipeline running on i-PRO's ADAM camera framework — an embedded app platform built on top of Panasonic's Amba V5X SoC. Here's what that looked like and what made it interesting.

## The Landscape: Embedded Cameras Aren't Linux VMs

i-PRO cameras don't run Debian. They run a real-time OS with the **ADAM (Application Development and Management)** framework — essentially a constrained app runtime with its own lifecycle, event model, and sandboxing. Think of it as the world's most opinionated Docker for cameras, but without the networking stack or package manager.

The target hardware runs an ARM64 (aarch64) AmbaCV5XCEX SoC with ~180 MB of heap available to applications. That's not a lot when your model weights are already in the hundreds of megabytes. The catch: i-PRO cameras come pre-installed with Python 3.7 under `/usr/bin/python3`, so you're working with what's there.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              i-PRO Camera                    │
│                                             │
│  ┌──────────────┐   ┌──────────────────┐   │
│  │   ADAM Core  │◄──►│  Platerecognizer │   │
│  │  (C/C++ API) │   │     Stream App    │   │
│  └──────┬───────┘   │                  │   │
│         │            │  main.cpp (host) │   │
│         │            │  pymain.py (logic)│   │
│         ▼            │                  │   │
│  ┌──────────────┐    └──────────────────┘   │
│  │  Python 3.7  │                           │
│  │  (bundled or │◄── appPrefs.json           │
│  │   camera-inst)│                           │
│  └──────────────┘    ┌──────────────────┐   │
│                      │  ONNX Runtime     │   │
│                      │  + OpenCV         │   │
│                      └──────────────────┘   │
└─────────────────────────────────────────────┘
```

The app splits into two layers:

### The C++ Host (`main.cpp`)

This is the bridge between ADAM's event loop and your Python logic. It handles:

- Camera lifecycle (start/stop/restart callbacks)
- App preferences passed from the i-PRO web UI (via `appPrefs.json`)
- Memory management for the Python GIL across threads
- Communication back to ADAM Core for frame data access

The C++ code embeds the Python interpreter using `Py_Initialize()` and `PyRun_SimpleFile()` — it reads a Python file from disk and executes it in-process. This is simpler than building a full Python-C API bridge, and perfectly adequate when your Python module is mostly stateless processing logic.

```cpp
// Simplified embedding pattern from main.cpp
void initPython() {
  // Dynamic PYTHONPATH based on deployment target
  #if defined(ADAM_TARGET_PF_ipro_ambaCV5XCAZ_linux)
    std::string pythonPath = "/app/python";
  #else
    std::string pythonPath = ADAM_GetAppDataDirPath() + "/../python";
  #endif
  
  // Conditional PyEval_InitThreads for Python < 3.9 compatibility
  #if (PY_MAJOR_VERSION == 3) && (PY_MINOR_VERSION < 9)
    PyEval_InitThreads();
  #endif
  
  Py_Initialize();
  s_pAdamModule = PyImport_ImportModule("libAdamApiPython");
}

void executePython() {
  std::string pyFile = /* resolved path */ + "pymain.py";
  
  FILE* pFp = fopen(pyFile.c_str(), "r");
  PyGILStateLock _lock; // RAII GIL management
  int ret = PyRun_SimpleFile(pFp, pyFile.c_str());
  if (ret != 0) {
    PyErr_Print();
    ADAM_DEBUG_PRINT(ADAM_LV_ERR, "Python execution failed\n");
  }
}
```

The `PyGILStateLock` class is critical here — it's a RAII guard that ensures the GIL is acquired before any Python C API calls and released when the scope exits. Without it, you get intermittent crashes that are nearly impossible to reproduce in testing.

### The Python Runtime (`pymain.py`)

The actual plate recognition logic lives in Python. This is where the ONNX model runs, frames get processed through OpenCV, and results get formatted for the ADAM event system. Since i-PRO's environment provides `libAdamApiPython`, you get access to:

- Camera frame data streams
- App preferences (license key, token, log level) from `appPrefs.json`
- HTTP networking to PlateRecognizer's API (for cloud mode) or local detection models

```json
{
  "preference": [
    { "prefName": "LICENSE_KEY", "prefType": "String" },
    { "prefName": "TOKEN",      "prefType": "String" },
    { "prefName": "LOGGING",    "prefType": "Enumeration",
      "enumerationList": ["10","20","30","40","50"] }
  ]
}
```

These preferences are what the camera's web UI shows to end-users — no code change needed between a dev install and production deployment.

## Building: Two Paths, Same Result

The project ships two Dockerfiles for different build scenarios:

### Local Build (`Dockerfile.ext`)

For development and testing without i-PRO's cloud toolchain:

```dockerfile
ARG CADAMBUILDBASE_PATH
ARG CADAMAPPBASE_PATH
FROM ${CADAMBUILDBASE_PATH} AS build-env

WORKDIR /app
COPY . ./
WORKDIR /iprosdk
RUN chmod +x setup_env.sh
RUN /bin/bash -c "source setup_env.sh ambaCV5XCEXinternal && \
    cd /app && \
    make clean && \
    make"

FROM ${CADAMAPPBASE_PATH} AS aplbase
RUN useradd -ms /bin/bash moduleuser
WORKDIR /app
COPY --from=build-env /app/ /app/
USER moduleuser
```

This uses the camera SDK's cross-compilation toolchain to produce a `.ext` package — i-PRO's app bundle format. The Makefile is ADAM-specific and auto-generates build rules based on `TARGET_FOR_ADAM`.

### Azure IoT Build (`Dockerfile.azureIoT`)

For production builds, i-PRO hosts the SDK in their private ACR:

```dockerfile
FROM iprocamsdk.azurecr.io/sdk/containeradam/env/cdamenv:1.0.0 AS build-env

RUN mv /iprosdk/lib/aarch64-linux-gnu_CV5XCAZ/libForPython3.7/* \
    /iprosdk/lib/aarch64-linux-gnu_CV5XCAZ

RUN /bin/bash -c "source setup_env.sh ambaCV5XCAZipro && \
    cd /app && make clean && make"

FROM iprocamsdk.azurecr.io/sdk/containeradam/env/cdamappbase:1.0.0 AS aplbase
COPY --from=build-env /app/ /app/
CMD ["/usr/share/lib/cadamClient"]
```

The `libForPython3.7` symlink dance is a known workaround — the SDK's library layout changes between versions and the Python module loader needs to find `.so` files in a specific path.

## Configuration at Runtime

The app's configuration file tells ADAM everything about the binary:

```
APPLICATION     platerecognizerStream
APPVERSION      V1.2
ROMSIZE         1055920
RAMSIZE         300000
CPURATE         90
FUNCID          00002178
```

- **RAMSIZE** (300 KB) is the temporary allocation *on top of* the heap — not total memory
- **CPURATE** (90%) tells ADAM this app needs aggressive scheduling; higher values mean more CPU budget but less sharing with other apps on the same camera
- **FUNCID** is a licensing marker used by i-PRO's app store for version tracking

## The Installer: A Python CLI You'll Actually Use

Since these cameras don't have `pip` or a package manager, we built a small installer that talks to the camera's ADAM CGI endpoints over HTTP Digest auth:

```python
# installer.py uses requests-toolbelt for multipart uploads
# with tqdm progress bars — because watching a 15MB upload on a slow link
# deserves better than blank terminal output

def upload_adam_app(ext_file_path):
    file_size = os.path.getsize(ext_file_path)
    progress_bar = tqdm.tqdm(desc=f"Uploading [{ext_file_path}]",
                             total=file_size, unit="B", 
                             unit_scale=True, unit_divisor=1024)
    
    def progress_callback(monitor):
        progress_bar.update(monitor.bytes_read - progress_bar.n)
    
    encoder = MultipartEncoder(fields={
        "methodName": "installApplication",
        "applicationPackage": (os.path.basename(ext_file_path), fp, 
                               "application/octet-stream"),
    })
    monitor = MultipartEncoderMonitor(encoder, progress_callback)
    response = requests.post(url, data=monitor, auth=HTTPDigestAuth(user, pass))
```

It handles the full lifecycle: list → stop → uninstall → upload → start. No manual SSH needed.

## What Made This Hard

### 1. Python GIL + Real-Time Scheduling

The ADAM framework runs the app's main thread in a real-time event loop. Embedding Python means that loop competes with `PyEval_InitThreads()` for CPU time. The solution was using `Py_UNBLOCK_THREADS` before the ADAM event dispatch and `Py_BLOCK_THREADS` after — effectively telling the interpreter "this is safe to suspend."

### 2. Memory Is Everything

The V5XCEX SoC has 1GB total RAM, but the camera firmware, video encoding, and network stack consume most of it. Your app gets ~180 MB heap plus a small scratch buffer. This means:

- No lazy model loading — everything initializes before the first frame
- OpenCV uses `cv2.IMREAD_GRAYSCALE` where possible to halve frame buffers
- ONNX models use the execution provider optimized for ARM NEON (not CUDA)

### 3. Cross-Compilation Is a Black Box

i-PRO's toolchain isn't standard Yocto or Buildroot — it's vendor-supplied and opaque. You get `setup_env.sh` which sets compiler paths, sysroot, and flags. Breaking the build pipeline for new SDK versions is an annual maintenance task.

## Debugging

i-PRO ships two tools worth knowing about:

- **Resource Monitor** — Docker container browser, live tail of container logs, and per-container resource usage.
- **Adam Operations UI** (Chrome extension) — start, stop, uninstall apps; useful when the web UI is unresponsive.

Remember: no SSH to the camera by default. No `gdb` attached to the process. The only debug output goes through ADAM's logging infrastructure (`ADAM_DEBUG_PRINT`) which surfaces in the i-PRO web UI at a configurable log level — and even then, it's line-buffered.

## Installation Walkthrough

Here's what deployment looks like in practice:

**Supported models:** CV52-series cameras with Docker capability — WV-X15300*, WV-X15500*, WV-X22300*, WV-X22500* and the X25600/X22600/WV-X15700/WV-X22700/WV-X25700 lines. The older CV2/CV22/CV25m (ambaCV2X) chips are **not** supported.

**Before you start:**
- Upgrade to the latest firmware first — extract the `.img` file from i-PRO's documentation database and install via Setup > Maintenance > Upgrade. Stream needs Docker support that only ships in recent firmwares.
- Enable "Ext. software mode" in the camera UI, then mount `/mnt/sda/adamapp` → `/user-data` for SD card storage. The flash has a write-cycle limit; without an SD card you'll kill the camera's NAND over time.
- You need ~700 MB free (Stream + models) and internet access from the camera for license validation.

**Installing:**
The camera runs two AdamApps: the **Docker extension module** (prerequisite, installed from i-PRO's docs first), then the **Stream `.ext`** bundle itself. You can use the camera web UI (Setup > Application > Extensions) or the Adam Operations UI Chrome extension. If the camera throws a ROM error during install, just retry — it works.

**Configuring detection:**
Everything goes through the Plate Recognizer dashboard — add your camera with an RTSP URL from these patterns:
```
rtsp://<cam_ip>:554/mediainput/h264/stream_1
rtsp://<user:pass>@<cam_ip>:554/mediainput/h264/stream_1
# stream_2, stream_3, stream_4 for multi-stream cameras
```
Recommended feed: 1280×720 at 15fps, H.264.

For detection results, enable webhooks in the Plate Recognizer account and turn on **caching** if the camera's internet is spotty — it queues results locally and flushes when connectivity returns.

The biggest win: **the Python code is identical to what runs on Docker.** Only the C++ host layer changes — the embedding glue that translates ADAM events into Python calls. Everything from frame processing through API submission stays in one `pymain.py`.

## Open Questions

- Can we replace the Python host with a Rust binary that spawns Python as needed, reducing memory pressure?
- The ADAM framework doesn't expose GPU acceleration — is there a path to NPU inference on newer i-PRO models?
- Would container-based deployment (`Dockerfile.ext`) eventually replace `.ext` packages for app distribution?

For now, it runs. And running on edge cameras that have never seen Docker is still one of the more satisfying engineering victories I've had this year.

---

*This work is part of the [deep-license-plate-recognition](https://github.com/parkpow/deep-license-plate-recognition) project at PlateRecognizer — specifically the `stream/ipro-adam-app` module for on-camera deployment.*
