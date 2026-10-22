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

## Cool-color tides and restored orb

The main Nox title uses the gothic Unifraktur Maguntia face again. The canvas palette blends continuously through seafoam, blue, purple, and teal over a slow 65-second cycle, including during idle listening. The restored orb samples the same palette in reverse and scrolls its gradient independently over 42 seconds. Audio recoil remains layered over the slow movement. Motion-off freezes palette progression and orb animation. Browser checks cover evolving palette values, visible orb, spring recoil, motion-off freezing, and mobile width; production build passes.

## Noticeable passive collection colors

The Dystofuture cover and its moon now use a continuously changing cool palette plus an independently scrolling 22-second gradient. The site palette cycle is now 32 seconds, with brighter light fields and palette-linked panel borders; no audio or hover is needed. Orb colors continue in reverse. Motion-off freezes the colors and pauses the collection gradient. Chromium checks simulate eight idle seconds to verify both the background palette and rendered cover gradient change, then verify motion-off freezes them, the cover animation pauses, and mobile width fits. Production build passes.

## Separate pages

Client-side routes now provide Sanctuary (`/`), Listen (`/listen`), Protect (`/protect`), and Vault (`/vault`) as separate visible pages. Existing artwork, animation, forms, and audio are retained in the shared app. Navigation preserves loaded audio and unsaved form fields; a compact player appears outside Listen when a song is loaded. Browser back/forward works, and legacy section hashes redirect to their corresponding page. Vercel rewrites serve the app for direct page visits. Local vault data remains on the same origin and in the same IndexedDB database.

Validated in Chromium: direct navigation/reload for each route, legacy `#protect`, active nav state, back-button form preservation, saving and viewing a record across pages and reload, retained canvas, and all four mobile layouts. Production build passes. The live deployment was blocked by the environment proxy, so remote deployment behavior is not verified.

## Dreamy depth and protection upgrades

Added decorative star-depth parallax, scroll-depth haze, soft screen reflections, and subtle nostalgic framing. All artwork remains; motion-off and reduced-motion disable the new movement. Protect and Vault now use larger text, labels, controls, and file details. Vault includes search, work/audio totals, copy fingerprint, stored-original integrity verification, and a browser durable-storage request. Durable storage is browser-controlled and is not cloud backup.

Encrypted `.nox` backups include metadata and any stored audio, use AES-256-GCM with a random 96-bit IV and PBKDF2-SHA-256 (310,000 iterations, random 128-bit salt), and are created locally. Export verifies stored-audio hashes first. Restore authenticates the archive, validates records and lengths, verifies every included audio hash, then imports new records in a single IndexedDB transaction. Existing hashes are preserved, and a failed validation imports nothing. Passwords are cleared from form fields after each operation. Lost passwords cannot be recovered. The unencrypted archive size is capped at 150 MB for browser memory; larger originals can be downloaded separately. The local vault remains unencrypted. This implementation has tests, not an independent security audit.

Actual cloud uploads, accounts, remote access controls, server timestamping, and infringement monitoring are not implemented or configured. Users can manually store the encrypted file with their own cloud provider; the site does not forward songs. Choosing a storage/authentication provider is still required before implementing and testing real cloud storage. No cloud data-protection claim is made.

Validation: `npm test` covers exact encrypted audio/metadata round-trip, wrong password, ciphertext tampering, incorrect original hashes, weak passwords, and independent Node AES-GCM interoperability. Chromium end-to-end checks exercise save, integrity, search/counts, encrypted export, cancellation/deletion, wrong-password safety, restore, original-byte download, duplicate preservation, reload, all mobile routes, and motion-off. `npm run build` passes.

## Stable playback-only color boost

Replaced raw frequency-to-hue rotation and treble-triggered jolts with a time-based audio response controller. Audible playback smoothly increases saturation and glow, while the idle cool-color drift stays restrained. Pause, mute, silence, seeking, buffering, and hidden tabs stop new onsets; envelopes settle rather than switching abruptly. Playback changes reset onset history and use a 250 ms warm-up. Bass onset detection has a bounded impulse, cooldown, lower analyser smoothing, and clamped spring velocity. The palette still cycles smoothly, and beat effects change color strength rather than rapidly rotating hue.

`npm test`: eight passing tests, including frame-rate consistency, bounded bass hits, treble-jitter/steady-tone suppression, warm-up, idle/silence decay, and encrypted-backup regression tests. Chromium with a generated pulse WAV verifies playback-only boost/recoil, pause/mute decay, unmute/resume recovery, seeking, and motion-off with no browser exceptions. This is reactive onset sync, not a precomputed tempo map.
