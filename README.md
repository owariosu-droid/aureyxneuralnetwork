# Dystofuture — sound sanctuary

Standalone site, separate from the Aureyx repository.

## Run

Node.js 22+ recommended.

```sh
cd /workspace/dystofuture
npm ci --cache /tmp/dystofuture-npm
npm run dev
```

`npm run build` generates `dist/` for static hosting. Audio and SHA-256 fingerprints run entirely in the browser. HTTPS is required in production for Web Crypto. No credentials or backend are required.

Bandcamp blocked automated catalog access, so the site links to the real artist catalog rather than inventing tracks. Load a local audio file for sound-reactive playback. Google Fonts supplies the gothic wordmark and editorial serif with system fallbacks.

Fingerprints identify exact file bytes. The downloadable record is self-declared, uses the device clock, and is not copyright registration, trusted timestamping, infringement monitoring, or proof of authorship. Those services require additional integrations and verification.

Validation: production build; browser desktop/mobile layout; motion toggle; local WAV loading; downloaded SHA-256 checked against an independent Node.js hash.
