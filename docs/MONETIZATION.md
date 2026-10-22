# Nox revenue plan

Nox can sell convenience, dependable storage, collaboration, and listening experiences. It must describe its current fingerprint and local-backup tools accurately: they do not register copyright, prove authorship, or detect music theft.

## Recommended starting model

Keep local fingerprinting, verification, and basic encrypted export free. Validate interest with a supporter option or a paid visualizer/custom-theme product before taking on recurring storage costs. A supporter purchase must clearly state what it funds and must not imply cloud backup.

A future Nox Plus plan could test roughly $5–10/month for a clearly capped amount of private cloud storage, automatic backup, version history, and controlled sharing. This is a pricing hypothesis, not a published offer. Team workspaces could become a separate higher-priced plan after collaboration and permissions are implemented. Avoid unlimited-storage promises.

## Requirements before selling cloud subscriptions

- Choose a storage provider and account/authentication service; implement private per-user authorization, signed access, deletion, and recovery flows.
- Decide whether originals are encrypted on the client. Explain recovery limits and who can decrypt them; do not describe a browser password field as a full zero-knowledge architecture.
- Implement upload progress, retries, integrity checks, verified remote receipts, backups, quotas, retention, and restore tests against real storage.
- Integrate a payment provider with server-verified webhooks, subscription entitlements, billing management, cancellation, and refund handling. Never expose server credentials in the frontend.
- Publish accurate terms, privacy and retention notices, pricing, and support expectations. Test subscription failure and storage-over-quota behavior without unexpectedly deleting originals.

## Economics to validate

Measure storage per paying account, upload/download traffic, restore frequency, payment fees, support, and churn. Estimate monthly contribution as price minus those variable costs. Include a budget for retained versions and operational backups; they consume storage too. Start with a small quota and change pricing only from observed usage and user interviews.

## Optional later products

Artist listening pages, premium reactive visual themes, collaborator review links, and team archives are natural extensions. Independent timestamping or professional rights services require real third-party integrations and precise descriptions of what they establish. Affiliate referrals should be disclosed. No billing or cloud subscription is implemented by this document.
