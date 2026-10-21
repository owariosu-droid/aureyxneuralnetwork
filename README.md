# Nox — sound sanctuary

Standalone Nox music site, hosted in the aureyxneuralnetwork repository.

## Run

Node.js 22+ recommended.

```sh
cd /workspace/aureyxneuralnetwork
npm ci --cache /tmp/dystofuture-npm
npm run dev
```

`npm run build` generates `dist/` for static hosting. Audio and SHA-256 fingerprints run entirely in the browser. HTTPS is required in production for Web Crypto. No credentials or backend are required.

Bandcamp blocked automated catalog access, so the site links to the real artist catalog rather than inventing tracks. Load a local audio file for sound-reactive playback. Google Fonts supplies the gothic wordmark and editorial serif with system fallbacks.

Fingerprints identify exact file bytes. The downloadable record is self-declared, uses the device clock, and is not copyright registration, trusted timestamping, infringement monitoring, or proof of authorship. Those services require additional integrations and verification.

Validation: production build; browser desktop/mobile layout; motion toggle; local WAV loading; downloaded SHA-256 checked against an independent Node.js hash.

## Nox vault

The vault uses IndexedDB, scoped to the current browser and site origin. Save credits, notes, a SHA-256 fingerprint, and optionally the original audio. Duplicate hashes preserve the original record. Export individual records or all metadata as JSON; original audio is downloaded separately. Individual records can be verified against a selected audio file, including records from the earlier version.

Storage is local, unencrypted, and not synced. It can be erased by clearing browser data and is accessible to other people using the same browser profile. Keep independent backups. There is no submission forwarding, server upload, account system, or cloud backup. Edited or re-encoded files produce different hashes.

Custom sounds: use the existing local audio picker to audition your sounds with the visualizer. No interface sound effects autoplay. Production interface cues can be added once final sound assets are provided.

Validated: reload persistence, duplicate prevention, exact original-file download, SHA-256 against Node crypto, matching and mismatching verification, persistent deletion, and mobile layout with no browser exceptions.

## Audio-reactive atmosphere

Local player audio is analysed with Web Audio (2048-point FFT). Bass (30–250 Hz) moves the haze and orb; mids (250–2500 Hz) and highs (2500–12000 Hz) shift the cool-color palette. Adaptive bass-onset detection adds a gentle pulse with a 350 ms minimum interval; this is reactive beat detection, not a BPM grid or guaranteed beat alignment. A 24-band display follows the spectrum. Smoothing uses elapsed frame time, and reactions fade when playback pauses, ends, is muted, or the tab is hidden. Motion can be disabled and follows a system reduced-motion change. External Bandcamp playback is not analysed.

Validated in Chromium with a synthesized multi-frequency pulse WAV: frequency-band and color response, motion toggle, decay after pause, and reduced-motion changes. Vault regression checks and production build pass.

## Dreamscape and physical recoil

The original canvas background draws translucent flowing filaments over cyan, violet, rose, and blue light fields. Bass and high-frequency onsets kick a damped spring that displaces and bends the scene, then recoils. Controls and text remain steady. An atmosphere intensity slider adjusts the new background response; zero disables recoil. Motion-off and reduced-motion settings freeze the scene. Rendering is capped near 30 fps with device pixel ratio limited to 1.5.

The referenced artist website could not be inspected (HTTP 403 and browser tunnel denial); no assets or layout were copied. Chromium checks verify actual audio-triggered recoil, zero-intensity and motion-off behavior, mobile width, and no browser exceptions. Production build passes.

## Phosphor visual direction

Updated from the supplied screenshot: green phosphor palette, subtle scanlines, procedural signal columns and scope rings, oversized NOX title, and terminal-style controls. The original ribbon field and audio-triggered spring recoil remain. No artwork from the reference is embedded. Gothic branding and editorial section typography remain alongside the terminal treatment. The production build and Chromium audio-recoil/motion/mobile checks pass.
