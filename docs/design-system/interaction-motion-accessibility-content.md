# Interaction, motion, accessibility, and content standards

These standards apply to every Jam App surface: mobile participation flows, host controls, and venue displays. A user must be able to understand what happened, what is happening, and what they can do next without relying on color, motion, or pointer input alone.

## Interaction and feedback

- Acknowledge an action immediately. Change the pressed control, announce a status, or update the affected content in the same interaction cycle.
- For submissions, replace the action label with a specific present-progress label such as “Saving…” and show a progress indicator. Disable the submitting control until the request settles so the same action cannot be sent twice.
- A disabled control must remain legible and must not look selected. If the reason is not obvious from nearby content, explain what prerequisite enables it. Do not use a disabled control when the user needs to discover that explanation through focus or hover; keep it enabled and provide inline guidance instead.
- Success feedback says what changed. Persistent or consequential changes use an inline status near the result; transient confirmation may use a toast. Announce asynchronous success with a polite live region.
- Errors say what failed, preserve the user’s input, and offer a concrete recovery action. Put validation beside its field and associate it with `aria-describedby`; put request failures beside “Try again” or a safe alternative. Use an assertive alert only when immediate attention is required.
- Empty states explain what the area will contain and offer the primary next action when the user can resolve the state.
- Destructive actions use an explicit verb and object (“Remove song”), never a vague “Yes.” Confirm actions that are difficult to reverse or affect other people. The confirmation names the consequence, defaults focus to the safe action, and distinguishes the destructive action visually and in text.
- Prefer undo for quick, reversible actions. When undo is impossible, say so before confirmation. Never claim success before the system has accepted the change.

## Focus, keyboard, and targets

- Every interactive element is reachable and operable with a keyboard in a logical visual order. Use native buttons, links, inputs, and headings before adding ARIA.
- Show a high-contrast focus indicator for `:focus-visible`. Use `.ds-focusable` for the shared three-pixel ring and offset. Do not remove an outline without an equivalent replacement.
- Pointer and touch controls use `.ds-control` and have at least a 44 by 44 CSS-pixel target. Compact host controls may be 36 pixels only in pointer-dense desktop contexts; venue controls should use the 56-pixel shared-display target.
- Enter or Space activates buttons. Enter follows links and submits a focused form when appropriate. Escape closes the topmost dismissible overlay. Arrow-key behavior is reserved for composite widgets whose established pattern requires it.
- Do not implement positive `tabindex` values. DOM order must provide the meaningful order. Focus is never trapped outside the visible interface.
- Icon-only controls have an accessible name that describes the action, such as `aria-label="Dismiss notification"`. Images use meaningful alternative text or empty `alt` text when decorative. Visible labels are preferred to placeholders.
- Status icons and colors always have a text equivalent. Changing color alone is not sufficient feedback.

## Dialogs and overlays

- Use `role="dialog"` for a workflow and `role="alertdialog"` only for an interruptive decision that needs immediate attention. Set `aria-modal="true"` when background content is inert.
- Give every dialog an accessible name with a visible heading referenced by `aria-labelledby`. Reference supporting consequences or instructions with `aria-describedby`.
- On open, move focus to the first task control, the heading for long informational content, or the least destructive action in a confirmation. Keep Tab and Shift+Tab inside a modal overlay.
- Escape closes dismissible dialogs. A close button remains available and has a specific accessible name. Do not let backdrop clicks be the only way out.
- When the overlay closes, restore focus to the control that opened it. If that control no longer exists, move focus to the nearest logical workflow target.
- Layer only one modal decision at a time. Preserve the page state beneath it and prevent background scrolling.

### Screen-reader implementation checklist

- Associate every visible form label with its control using a stable `for`/`id` pair; use `aria-describedby` for prerequisites, consequences, and field-level help rather than placeholder text.
- Put asynchronous progress and completion in a nearby `role="status"` with `aria-live="polite"`; set `aria-busy="true"` while the region is settling, and reserve `role="alert"` for failures that need immediate attention.
- Give dialogs a visible heading referenced by `aria-labelledby`, keep the decision and its consequence in `aria-describedby`, and expose only the dialog while it is open. Return focus to the invoking control after dismissal.
- Test the spoken result, not only the visual state: loading, success, error, retry, disabled prerequisites, and destructive confirmation must each announce what changed and the next available action.

## Motion

Motion explains a relationship or state change; it is not decoration required to understand the interface.

- Immediate press and hover feedback uses `--ds-motion-feedback` (120ms). State changes use `--ds-motion-state` (220ms). Entrances may use `--ds-motion-enter` (320ms); exits use the shorter `--ds-motion-exit` (160ms). Use `--ds-ease-out` for settling motion.
- Animate opacity and transforms when they clarify origin, hierarchy, or continuity. Avoid animating layout properties and avoid continuous ambient motion around task controls.
- Never communicate progress, validation, or status through motion alone. Pair it with persistent text, an icon with a text equivalent, and an appropriate live-region announcement.
- Honor `prefers-reduced-motion: reduce`. Remove travel, parallax, looping, and nonessential transitions; use an immediate cross-fade or direct state change. The global reduced-motion rule shortens animation and transition durations and disables smooth scrolling.
- Pausable user-controlled media is the exception, not a reason to ignore the preference. Avoid flashes and rapid contrast changes.

## Content and localization

- Lead buttons with a concise verb and the object: “Save setlist,” “Join jam,” “Remove song.” Keep one concept per label and avoid “Click here,” “OK,” and unexplained technical terms.
- Success messages describe the completed outcome. Error messages use plain language in this order: what failed, what remains safe, and what to do next. Do not blame the user or expose raw server errors.
- Empty states are specific and constructive: “No songs in the schedule yet” followed by “Add song.” Do not use a dead-end “No data.”
- Use i18next plural rules rather than joining a number to a fixed noun. Provide singular and plural translations in Portuguese, English, and Spanish and test representative values including zero, one, and more than one.
- Add every new key to `src/locales/pt.json`, `en.json`, and `es.json` in the same change. Treat Portuguese as the product’s default authoring locale, then review English and Spanish as authored interfaces rather than literal word-for-word copies.
- Expect labels and messages to expand by at least 30 percent. Controls allow wrapping and grow vertically; layouts reflow instead of truncating actions. Reserve single-line truncation for secondary metadata whose full value remains available elsewhere.
- Do not concatenate translated fragments. Interpolate complete sentences so each language controls grammar and word order. Localize dates, times, numbers, and lists with the platform `Intl` APIs or the existing formatter layer.
- User-generated names and notes use `.ds-wrap-user-content` so long unbroken strings do not break the layout. Preserve accents and language-specific punctuation.

## Workbench review checklist

The representative stories under **Foundations / Interaction, accessibility and content** cover feedback, loading, disabled actions, recovery, destructive confirmation, keyboard operation, focus restoration, dialog naming, reduced motion, and Portuguese/English/Spanish expansion.

For a component or flow, verify:

1. Operate it with Tab, Shift+Tab, Enter, Space, and Escape without a pointer.
2. Confirm visible focus, logical order, target size, label association, roles, names, descriptions, and status announcements.
3. Exercise idle, loading, disabled, success, error, retry, destructive, and recovery states that apply.
4. Toggle the reduced-motion workbench global and confirm no information disappears.
5. Review Portuguese, English, and Spanish at phone width and with long realistic content.
6. Run the Storybook interaction and accessibility checks before merging.
