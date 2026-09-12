# Canonical data display

The data-display family gives Jam App one visual vocabulary for content that is
read more often than it is edited: badges, status indicators, cards, list rows,
and compact metadata. The primitives are product-agnostic and consume the
semantic foundation roles from `foundations.css`; domain wrappers translate Jam,
Music, Schedule, and Public Dashboard values into those primitives.

## Primitive contract

- `Badge` communicates a short classification or count with a semantic `tone`.
  Status meaning is always written in the label; color is never the only signal.
- `StatusIndicator` pairs a status dot with required visible text. `live`,
  `offline`, `pending`, and `completed` are convenience statuses that preserve
  the same semantic mapping across product areas.
- `DataCard` is a non-interactive surface by default. Use `density="compact"`
  for repeated queue/library content and `density="comfortable"` for a primary
  content region. `selected` adds presentation and a `data-selected` hook only;
  the consumer must expose selection in visible text or through the semantics of
  its owning widget.
- `ListRow` reserves leading, primary, metadata, and trailing regions. The
  primary value wraps user content, while consumers may opt into
  `ds-truncate-single` only when the full value is available through nearby
  context or a title.
- `CompactMetadata` is a labelled description list for secondary details. It
  wraps long values and reflows at narrow widths rather than shrinking text.

All controls retain a minimum 44px touch target through the foundation tokens.
The `ds-shared-display` context scales type at the venue breakpoint; the data
display primitives do not replace the music hero with metadata or controls.

Cards and rows never manufacture button semantics. Put a native link or the
canonical `Action` inside the surface when it has an operation, and let the
owning list, grid, or navigation widget provide its selection semantics.

## Domain separation

`src/components/data-display` contains only generic presentation primitives.
`src/components/music/MusicDataDisplay.tsx` maps music statuses and values into
those primitives. The existing `MusicCard` is the representative production
consumer; this ticket does not migrate the rest of the application.

## Review coverage

The private workbench story **Foundations / Data display** exercises realistic
Jam, Music, Schedule, and Public Dashboard content at phone, desktop, and venue
viewports. Review `jam-light`, `jam-dark`, and a DaisyUI theme with the locale
toolbar; long titles and names should wrap unless a secondary repeated value is
explicitly marked for truncation.
