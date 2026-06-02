# Donezo

Donezo is a macOS desktop TodoList app built with Electron. It focuses on a lightweight daily workflow: add tasks quickly, classify them by importance and urgency, switch between list and quadrant views, and track completion progress.

## Current Build

The current DMG is available at:

```text
outputs/Donezo-0.1.0-arm64.dmg
```

This build is for Apple Silicon Macs (`arm64`, such as M1/M2/M3/M4). It is currently unsigned, so macOS may show an "unidentified developer" warning on first launch.

The unpacked app is also available at:

```text
outputs/mac-arm64/Donezo.app
```

## Run Locally

```bash
npm install --cache .npm-cache
npm start
```

## Check

```bash
npm run check
```

## Build DMG

```bash
npm run dist
```

The build script prepares local cache folders, runs syntax checks, and writes artifacts into `outputs/`.

## Data Storage

Tasks are stored locally through Electron's `app.getPath('userData')` path in `tasks.json`. No cloud sync is implemented.

