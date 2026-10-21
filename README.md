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
