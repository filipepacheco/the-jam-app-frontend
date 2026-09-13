---
status: accepted
---

# Use workflow controllers at UI seams

Schedule management, Live Queue interaction, Music library, and Jam participation place behavior in framework-neutral controllers with small state-and-command interfaces. Thin React hooks adapt controller state and lifecycle to screens; production transports and deterministic test adapters sit behind internal seams. This was chosen over hook-only modules so production callers and tests exercise the same behavior without coupling orchestration to React rendering.

Controllers return typed semantic outcomes and structured details. Screens own translation, presentation, and confirmation UI; commands lock only the affected entity unless the transition is genuinely global.
