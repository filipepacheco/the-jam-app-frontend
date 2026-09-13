---
status: accepted
---

# Use Performance language behind legacy Schedule transports

The frontend domain calls a Music selection within a Jam a Performance and reserves Schedule for the ordered collection of Performances. Existing backend DTOs, fields, and endpoints retain their `Schedule*` names at transport seams for compatibility, with adapters translating them into the frontend domain model. Renaming the backend contract is explicit backend debt rather than part of this behavior-preserving program.
