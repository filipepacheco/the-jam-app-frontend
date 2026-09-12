# Canonical form fields

Use the `Field` family for new product inputs, selects, and textareas. It keeps native controls native while supplying one stable field identity, visible label, requirement marker, supporting text, validation association, semantic disabled state, and semantic theme styling.

```tsx
import { Action, Field, FormSubmissionFeedback } from '../components'

<Field id="song-title" label={t('common.form_labels.title')} required requiredLabel={t('common.required')} hint={t('music_form.description_hint')} error={titleError} disabled={isSubmitting}>
  <Field.Input name="title" value={title} onChange={onTitleChange} />
</Field>

<Field id="genre" label={t('common.form_labels.genre')}>
  <Field.Select name="genre" value={genre} onChange={onGenreChange}>
    <option value="">{t('music_form.select_genre')}</option>
    <option value="jazz">Jazz</option>
  </Field.Select>
</Field>

<Field id="notes" label={t('music_form.info_label')} hint={t('music_form.description_hint')}>
  <Field.Textarea name="notes" value={notes} onChange={onNotesChange} />
</Field>

<FormSubmissionFeedback state="error" message={t('errors.generic_error')} />
<Action type="submit" variant="primary" state="loading" loadingLabel={t('common.saving')}>
  <Action.Label>{t('common.save')}</Action.Label>
</Action>
```

## API and semantics

- `Field` requires a stable `id` and visible `label`. It applies that ID to the one native control, links the label with `for`, and combines existing `aria-describedby` values with the optional `hint` and `error` IDs.
- `required` applies the native `required` property and a visible marker. Pass the localized `requiredLabel`; component primitives do not own product translations.
- `error` marks the control invalid and links the validation text using `aria-describedby` and `aria-errormessage`. Keep validation specific and beside the field. Preserve the entered value.
- `disabled` disables the native control. Place an explanation in `hint` when the prerequisite is not already evident. Disabled controls are not an error-recovery mechanism.
- `Field.Input`, `Field.Select`, and `Field.Textarea` expose the corresponding native attributes other than `id`, `required`, and `disabled`, which are intentionally owned by `Field`.
- `FormSubmissionFeedback` has one asynchronous state: `submitting`, `success`, or `error`. Progress and success use a polite status; request failures use an assertive alert. Keep it near the submit action. `Action state="loading"` already announces its loading label, so do not repeat that exact progress message in a second live region.

Controls use the shared 44px touch target and focus ring. Native inputs preserve Tab navigation, text editing, select keyboard operation, platform accessibility features, and browser zoom behavior. Labels, hints, errors, and feedback wrap rather than truncate so localized text and user content remain readable.

## Gradual migration compatibility

Existing DaisyUI `form-control`, `input`, `select`, and `textarea` markup remains supported while a workflow is reviewed. This ticket establishes the field family and migrates only `JamRegistrationForm`; it does not authorize a broad form redesign.

| Existing pattern | Canonical replacement | Compatibility note |
| --- | --- | --- |
| `label` plus `input input-bordered` | `Field` + `Field.Input` | Move the stable input ID to `Field`; keep name, value, autocomplete, pattern, and event handlers. |
| `label` plus `select select-bordered` | `Field` + `Field.Select` | Preserve placeholder option values, option order, and native keyboard behavior. |
| `label` plus `textarea textarea-bordered` | `Field` + `Field.Textarea` | Preserve rows, max length, and existing character-count feedback. |
| `label-text-alt` helper copy | `hint` | Keep prerequisite or formatting guidance associated through `aria-describedby`. |
| local validation text or alert | `error` | Keep request-level failures near the submit action through `FormSubmissionFeedback`; do not move field errors into a generic banner. |
| native `disabled` flags | `Field disabled` and `Action state="disabled"` | Explain non-obvious prerequisites in a nearby hint or submit-action description. |
| loading success/error banners | `FormSubmissionFeedback` | Preserve workflow-specific copy and recovery behavior; use `Action` loading state for the submit control. |

Before migrating another form, preserve its submit type, form ownership, validation timing, focus order, server-error recovery, and localized copy. Do not wrap bespoke composite widgets such as `SearchableSelect` until their keyboard and focus contracts have been audited against this API.
