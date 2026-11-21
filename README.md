# Nox — sound sanctuary

Standalone Nox music site, hosted in the aureyxneuralnetwork repository.

## Run

Node.js 22+ recommended.

```sh
cd /workspace/aureyxneuralnetwork
npm ci --cache /tmp/dystofuture-npm
npm run dev
```

`npm run build` generates `dist/` for static hosting. Audio and SHA-256 fingerprints run entirely in the browser. HTTPS is required in production for Web Crypto. No backend is required for offline private spaces. Supabase configuration is required for Community accounts and publishing.

Bandcamp blocked automated catalog access, so the site links to the real artist catalog rather than inventing tracks. Load a local audio file for sound-reactive playback. Google Fonts supplies the gothic wordmark and editorial serif with system fallbacks.

Fingerprints identify exact file bytes. The downloadable record is self-declared, uses the device clock, and is not copyright registration, trusted timestamping, infringement monitoring, or proof of authorship. Those services require additional integrations and verification.

Validation: production build; browser desktop/mobile layout; motion toggle; local WAV loading; downloaded SHA-256 checked against an independent Node.js hash.

## Nox vault

The vault uses IndexedDB, scoped to the current browser and site origin. Save credits, notes, a SHA-256 fingerprint, and optionally the original audio. Duplicate hashes preserve the original record. Export individual records or all metadata as JSON; original audio is downloaded separately. Individual records can be verified against a selected audio file, including records from the earlier version.

Current private-space storage is local, encrypted, passphrase-protected, and not synced. It can still be erased by clearing browser data. Keep independent encrypted backups. Community publishing uploads only a deliberately selected public audio copy when Supabase is connected. Edited or re-encoded files produce different hashes.

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

Encrypted `.nox` backups include metadata and any stored audio, use AES-256-GCM with a random 96-bit IV and PBKDF2-SHA-256 (310,000 iterations, random 128-bit salt), and are created locally. Export verifies stored-audio hashes first. Restore authenticates the archive, validates records and lengths, verifies every included audio hash, then imports new records in a single IndexedDB transaction. Existing hashes are preserved, and a failed validation imports nothing. Passwords are cleared from form fields after each operation. Lost passwords cannot be recovered. The unencrypted archive size is capped at 150 MB for browser memory; larger originals can be downloaded separately. Current private spaces also encrypt the local vault; older device-vault records remain unencrypted until explicitly migrated and removed. This implementation has tests, not an independent security audit.

The optional Community integration prepares Supabase account authentication, public release uploads, and ownership policies. It is not connected or live-validated yet. Private cloud backup, trusted server timestamping, and infringement monitoring are not implemented. Users can manually store encrypted backups with their own provider. See `supabase/README.md` for connection steps.

Validation: `npm test` covers exact encrypted audio/metadata round-trip, wrong password, ciphertext tampering, incorrect original hashes, weak passwords, and independent Node AES-GCM interoperability. Chromium end-to-end checks exercise save, integrity, search/counts, encrypted export, cancellation/deletion, wrong-password safety, restore, original-byte download, duplicate preservation, reload, all mobile routes, and motion-off. `npm run build` passes.

## Stable playback-only color boost

Replaced raw frequency-to-hue rotation and treble-triggered jolts with a time-based audio response controller. Audible playback smoothly increases saturation and glow, while the idle cool-color drift stays restrained. Pause, mute, silence, seeking, buffering, and hidden tabs stop new onsets; envelopes settle rather than switching abruptly. Playback changes reset onset history and use a 250 ms warm-up. Bass onset detection has a bounded impulse, cooldown, lower analyser smoothing, and clamped spring velocity. The palette still cycles smoothly, and beat effects change color strength rather than rapidly rotating hue.

`npm test`: eight passing tests, including frame-rate consistency, bounded bass hits, treble-jitter/steady-tone suppression, warm-up, idle/silence decay, and encrypted-backup regression tests. Chromium with a generated pulse WAV verifies playback-only boost/recoil, pause/mute decay, unmute/resume recovery, seeking, and motion-off with no browser exceptions. This is reactive onset sync, not a precomputed tempo map.

## Reviewed save procedure

Protect now checks required credits, empty/oversized files, audio type/extension, duplicates, and available browser quota where exposed. The first action fingerprints and opens a review showing artist, filename, size, hash, storage choice, and local destination. Editing fields invalidates that review. Explicit confirmation writes the record, reads it back, and verifies included original audio before showing the saved receipt. The receipt distinguishes metadata-only saves from an actual audio copy and offers immediate record export and encrypted-backup navigation. An existing fingerprint-only entry can gain its matching original without replacing saved credits or dates. Busy operations prevent double submission, failures retain input, and Save another clears the previous file and work details while retaining the artist.

Browser checks cover required/empty-file validation, stale-review invalidation, fingerprint-only receipt and export, adding the matching original, stored-audio integrity, duplicates, resetting, mobile width, and persistence across reload. Eight automated tests and the production build pass. See `docs/MONETIZATION.md` for the proposed revenue model and prerequisites; no payments or cloud subscription are enabled.

## Offline originals across browser closure

Original audio storage is selected by default in Protect; fingerprint-only remains optional. Confirming a save requests durable browser storage where supported, and Vault displays the browser's reported durability. IndexedDB is retained across ordinary browser closure. It remains local, tied to the exact site origin and browser profile; current private spaces encrypt it at rest. Private-mode sessions, clearing site data, origin changes, and browser-controlled eviction remain limitations. Durable storage cannot override explicit deletion; retain encrypted backups.

Production builds generate a versioned service worker and manifest. The worker caches the app shell and exact hashed JS/CSS assets for offline routes, without caching uploaded songs or arbitrary network responses. Browser-vault audio stays in IndexedDB. Shell updates activate after existing tabs close; activation removes only old Nox shell caches, never the vault. Development mode does not register the offline worker. Vercel explicitly rewrites the three page routes and serves the worker with no-cache headers. Custom webfonts and external Bandcamp pages are not guaranteed offline; system font fallbacks remain available.

A saved original can be played directly from Vault using “Play offline original.” Validation used the production preview with a persistent Chromium profile: saved a real WAV, fully closed the browser, relaunched the same profile with networking disabled, loaded all four routes, verified the file fingerprint, downloaded identical bytes, and played the audio. Eight automated tests and the production build pass. Live Vercel behavior is not independently verified here.


## Independent private sessions and Community

Each offline private space has its own IndexedDB database, a random salt, PBKDF2-SHA-256 (310,000 iterations) passphrase derivation, and AES-256-GCM encrypted records/audio. Only salted key verification and encrypted payloads are stored; the record SHA-256 index remains visible in browser storage. A space is unlocked only in the current tab's memory. Reload, closure, and page exit lock it. Wrong passphrases cannot reveal records. Lock clears song lists, forms, review/receipt details, composer selections, and loaded audio. Anyone who knows a space's passphrase can unlock it; this is not a server identity check or an independent security audit. Shared devices should use separate browser profiles as well. Keep encrypted backups because lost space passphrases cannot be recovered.

Older unencrypted `nox-vault` records are retained, not assigned automatically. Their owner can explicitly import them into an unlocked space and verify originals. Once independently backed up, a separate confirmed action removes the old unencrypted database. Existing records with conflicting notes/credits prevent migration from declaring it safe to remove the old source. Other old tabs must be closed for deletion.

`/community` explains privacy and publishing, shows real public releases when connected, supports native audio playback and a Nox visualizer option, and provides a stored-audio composer with credits, genre, description, and explicit rights/public-download consent. It includes public-post removal for owners, report submission for signed-in users, search over loaded releases, and pagination. Supabase auth tokens are held in tab memory, not persisted across users or reloads. Offline-space passphrases are separate from community authentication. Signing out locks the space. No private record or notes are automatically uploaded. The public bucket deliberately contains public release copies, not protected masters.

Connect Supabase using `supabase/README.md` and `.env.example`. The SQL creates RLS ownership policies and a 50 MB public audio file cap. Accounts, remote publishing, deletion, email delivery, and server policies are UNVERIFIED until a real project is configured. A two-account access test script is provided but has not run against a live project. Configure moderation, abuse controls and server-enforced account quotas before opening unrestricted signups or charging for storage.

Validation: 11 passing automated tests including private-space separation, wrong-passphrase rejection, authenticated ciphertext tamper detection, atomic restore conflicts, backup crypto, and audio response. Chromium tests verify separate Alice/Bob spaces, locked independent tabs, cleared composer after lock, persistence after reload/unlock, encrypted raw IndexedDB payloads, explicit legacy migration, real browser close/relaunch offline with verified originals, and five page layouts at phone (390 px), tablet (768 px), and desktop (1440 px) widths. Tested in Chromium; not a claim of testing every physical device or browser. All existing visuals remain; additional side sigils and responsive parallax artifacts are decorative and do not intercept controls.

## Interface polish and listening controls

The home page now includes three destination cards for listening, preserving originals, and community sharing. The large private-space gate is collapsible and closes after unlock; trying to save while locked opens it and focuses the space field. Community song selection likewise points to unlock when needed. Vault empty states provide direct next actions, and displayed search results can be sorted by saved date, title, or artist. Date sorting uses timestamps rather than formatted date strings.

The local player has volume and loop controls, clearer playback/buffering/error messages, and a K play/pause shortcut outside interactive controls on the Listen page. Volume, atmosphere intensity, and motion preference are remembered locally; no songs or private credentials are stored in those preferences. System reduced-motion takes priority on startup. Zero volume suppresses playback-driven visual boosts. Browser autoplay denial prompts a tap on Play without replacing the song title with an error. A native keyboard-accessible help dialog explains local privacy, backups, and explicit public sharing.

Validation: production build and 11 automated tests pass. Chromium checks cover home destinations, guide/Escape dismissal, locked-save guidance, compact unlock, two real save procedures, title/date sorting, generated WAV playback, loop and volume, zero-volume visual decay, preferences after reload, and all five routes at 390, 768, and 1440 px widths. Community backend setup remains pending as documented in `supabase/README.md`.

## Oneiric observatory atmosphere

Nox now has overlapping seafoam, blue, violet, and lilac cloud volumes, broad translucent aurora folds, sparse light motes, and partial lens arcs. The earlier signal filaments and a few faint analog remnants remain. Fog renders to a small offscreen canvas (at most 530 px on its longest side) before being scaled smoothly; the main canvas retains its 32 ms paint cap and 1.5 maximum DPR. The palette changes slowly, with stronger saturation reserved for smoothed audible-playback response. Bass recoil remains bounded and all original interfaces and private-vault operations remain intact.

The hero adds near/far mist veils, a refractive moon with slowly moving internal clouds, a soft halo, orbit contours, small satellites, and pointer-depth dust. Panels and controls have dark opaque backgrounds for legibility. New styles live in `atmosphere.css`. The footer's Deep/Soft haze control remembers a non-private appearance preference; reduced-motion and Motion off freeze canvas changes and CSS mist/weather movement. These visuals are procedural and work without external image services.

Validation: 11 automated tests and production build pass. Existing browser regression checks pass for saving, sorting, playback, preferences, the guide, and five routes. New Chromium checks verify changing idle colors, physical recoil, visible fog, frozen canvas pixels with motion off, stopped CSS mist/weather animations, Deep/Soft preference persistence, and layouts at 320, 390, 768, and 1440 px. Screenshots were inspected for desktop and phone readability. A direct development-route conflict was also fixed by renaming `community.js` to `community-ui.js`; `/community` reloads now serve app markup rather than the source module.

## Expressive regional bass effects

Heavy low-end audio now drives a separate smoothed `surge` envelope (85 ms attack / 450 ms release), weighted by bass strength and dominance over mids. This drives localized color-current movement rather than abrupt global hue changes. Treble-only material remains comparatively calm, and pause/mute/silence let the response settle. The existing Bass & atmosphere slider scales both renderer motion and the orb's internal refraction; Motion off and reduced-motion still disable the effects.

The dreamscape adds orbiting cyan/blue/violet cloud lobes, side-edge currents, warped rotating portal halos, two flowing chromatic spiral arms, and up to four fading onset ripples. The right region receives most deformation, while the reading column and interface remain steady. The approach loosely evokes energetic rhythm-game backgrounds such as Butiti III, using original procedural geometry and Nox's soft haze rather than copied game assets. Idle color drift stays slow, and full-canvas flashes are not used. Phone views use fewer halos and segments; the low-resolution fog and frame cap remain.

Validation: 14 automated tests pass, including strong-bass versus treble discrimination, envelope decay, frame-rate stability, and existing privacy/backup tests. Chromium with generated treble and multi-frequency bass WAVs verifies stronger low-end movement, steady heading positions, zero-intensity control, pause/mute decay, resume, motion-off, and mobile width. A renderer comparison holding other signal values constant measured about six times more pixel change on the right than on the left; actual rendered pixels freeze with Motion off. Production build passes. This is an audio-reactive visualizer, not a precomputed beat/tempo map.

## Source-derived interface sounds

The Sound palette dialog can derive four short cues directly from a local source file: click (0.12 s), toggle (0.20 s), navigation (0.38 s), and verified save (0.50 s). `sound-design.js` selects audible source windows, filters and resamples them to mono 22050 Hz, applies short attack/release envelopes, and adds quiet reversed/source-derived tails. It uses no oscillator or generic synthesized replacement. All peaks are capped at 0.4 or less. Invalid, silent, excessively short, or unsafe imported palettes are rejected.

Interface audio starts OFF, is enabled only by an explicit gesture, has a separate 0–40% volume control, and softens to 22% of that volume during song playback. Clicks are rate-limited and playback is capped at three voices. File pickers, sliders, and text entry do not trigger repeated effects. Optional hover/keyboard-focus cues use dwell and cooldown limits; music controls now have deliberate press feedback. A save-confirmation cue is emitted only after the saved copy has been read back and verified. Hiding/exiting stops voices; locking a private space clears the in-memory palette and disables effects.

Source input is decoded locally, never uploaded, and is not added to the private vault. Browser import permits source files up to 128 MB and 10 minutes, with duration checked before full decode; shorter clips are recommended on memory-constrained devices. Only the four short derived cues can optionally be remembered, with explicit notice that anyone using the browser can enable them. Remembered effects remain OFF on reload until enabled again. A compact PCM16/base64 JSON palette can be exported, imported, cleared, or provided to the site operator for a future bundled default. The source file itself is not included in that export.

The supplied NEODR3AD.wav exceeded the workspace tool's 32 MiB transfer limit. Its exact source audio was therefore NOT processed or bundled during this change. Use Sound palette → choose the full local WAV → Create & enable sounds to derive it on your own device. Send the small exported palette or an MP3/shorter source under 32 MiB to finish a site-wide NEODR3AD default. No substitute fixture audio is shipped or described as NEODR3AD.

Validation: 17 automated tests pass, including source-dependent cue waveforms, soft endpoints, duration/peak limits, compact serialization, and invalid/tampered palette rejection. Chromium checks with a synthetic test fixture verify no autoplay, local derivation, trusted click/navigation cues, ducking, actual verified-save confirmation, disable/zero volume, explicit remembering, export/import/clearing, and mobile width. Separate real AudioBuffer tests include anti-phase stereo fallback. Actual NEODR3AD timbre/quality remains unverified until the source becomes accessible. Production build passes.


## Built-in cybernetic hover and press sounds

Enable **UI sounds** in the footer to use the original built-in cybernetic palette immediately; no audio import is needed. The pack includes a soft 58 ms hover ping, 105 ms digital press, 165 ms dual-step toggle, 300 ms airy navigation sweep, and 450 ms glassy confirmation. `cybernetic-sounds.js` generates deterministic mono 22050 Hz samples with soft endpoints and peaks at or below 0.33. These are original synthesized sounds, not NEODR3AD samples. Custom source-derived palettes remain supported; a short quieter hover is derived from their existing click cue, preserving the original four-cue import/export format.

Hover is quieter than pressing and requires a 75 ms dwell. Moving among a control's children does not retrigger; global 180 ms and per-control 650 ms cooldowns limit noise. Pointer-down cancels a pending hover, and pressing overrides a recent hover rather than losing the click to throttling. Keyboard Tab focus can use the same subtle cue. Touch devices use normal press feedback without artificial hover. Disabled controls, hidden controls, and sound settings are excluded from automatic hover. A separate checkbox disables hover while retaining clicks. The setting and volume persist, but sound playback still starts OFF on every reload. Music ducking, zero volume, voice caps, visibility stop, private-space lock, and verified-save confirmation remain.

Buttons and navigation also have subtle cybernetic edge glow and press feedback. Reduced-motion removes the press translation. The built-in generator needs no network or uploaded audio, so it is part of the cached offline app.

Validation: 21 automated tests pass, including four new tests for synthesized cue timing, bounded envelopes, distinct deterministic waveforms, and quieter source-derived custom hover. Browser checks cover startup silence, opt-in without importing, hover setting/preview, press/navigation, zero volume, old-pack reconstruction and switching back, export/import, reload silence, settings layout, and five routes at 320/390/768/1440 px. Production build passes.


Independent interaction tests also verified trusted 75 ms dwell hover, descendant transitions without retriggers, per-control cooldown, batched rapid pointer sweeps without pings, disabled-control silence, pressing immediately after hover, hover-off, full sound-off, and touch taps producing press-only audio. Automatic hover never tries to resume a suspended audio context; a deliberate activation can resume audio instead.
