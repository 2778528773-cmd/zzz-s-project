# Iteration Notes

## Current Artifact

Current successful build:

```text
outputs/Donezo-0.1.0-arm64.dmg
```

Architecture:

```text
arm64
```

This is correct for Apple Silicon Macs. For Intel Macs, build `x64`. For one package supporting both Apple Silicon and Intel, build `universal`.

## Build Environment

The project uses local cache directories to avoid writing into global user caches during builds:

```text
.npm-cache
.electron-cache
.builder-cache
```

Build command:

```bash
npm run dist
```

The build script sets:

```text
ELECTRON_CACHE=$PWD/.electron-cache
ELECTRON_BUILDER_CACHE=$PWD/.builder-cache
electron_config_cache=$PWD/.electron-cache
npm_config_cache=$PWD/.npm-cache
```

DMG creation requires macOS `hdiutil`. In sandboxed environments, it may need elevated/system access.

## Important Follow-Ups

- App icon source now lives at `assets/icon.svg`, with a generated PNG at `build/icon.png`.
- The build script runs `npm run icon` before packaging so the DMG/app icon stays current.
- Consider code signing and notarization before broader distribution.
- Add keyboard arrow navigation for the custom calendar.
- Consider a universal macOS build if the app should support Intel Macs.
- Consider a small settings panel if theme and completion mode become user-facing preferences.
- Add tests around task persistence and quadrant mapping if the app grows.

## Product Stance

Do not blindly add every requested feature. Keep challenging changes that make the app heavier or less coherent. The goal is a polished daily Todo app, not a full project management suite.
