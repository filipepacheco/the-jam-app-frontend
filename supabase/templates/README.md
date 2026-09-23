# Jam signup confirmation email

`confirmation.html` is the hosted Supabase **Confirm sign up** template.
`confirmation.subject.txt` contains its subject. Both use Brazilian Portuguese,
matching the production email this template replaces.

## Brand and rendering

The email uses the approved hybrid v1 logo and the Jam light palette. Email clients
cannot render the application's React components or DaisyUI theme tokens, so this
surface intentionally uses presentation tables and inline hex colors. No new
application component or workbench story is involved.

The 420 × 180 PNG is displayed at 140 × 60 for sharp rendering. Generate it from the
approved SVG with `node scripts/generate-brand-assets.mjs`. Deploy the public asset
before enabling the template:

`https://www.jamapp.com.br/brand/v1/logo-email-light.png`

The template uses a fluid 560px layout, mobile padding, a hidden inbox preheader,
an Outlook VML button, and a visible copyable fallback link. Text and links remain
usable with images blocked. Essential presentation is inline; media queries only
enhance the small-screen layout. System fonts are deliberate for email clients.

## Publish

Use Supabase Dashboard → Authentication → Email → Confirm sign up, or the
[Management API](https://supabase.com/docs/guides/auth/auth-email-templates).
Back up the existing subject and body. Patch only:

- `mailer_subjects_confirmation`: contents of `confirmation.subject.txt`, trimmed.
- `mailer_templates_confirmation_content`: contents of `confirmation.html`.

Email templates are hosted configuration: a Vercel deploy alone does **not** update
them. Do not use a general `supabase config push` for this change, because it could
also overwrite unrelated authentication settings.

Keep `{{ .ConfirmationURL }}` unchanged in the regular button, Outlook button, and
fallback link. Supabase supplies the verification URL and the signup request's
redirect destination. Do not substitute `SiteURL`, hard-code a callback URL, or add
tracking parameters. The image URL contains no recipient information or token.

## Verify

Preview with a synthetic confirmation URL at 320, 390, 440, and desktop widths.
Check that the long fallback URL wraps, the button remains readable, and images
can be disabled without hiding the action. After publishing, read back the subject
and template from Supabase and verify the public PNG responds as `image/png`.
Actual Gmail, Apple Mail, and Outlook inbox rendering requires a test signup email;
browser previews and the Outlook fallback markup do not replace that check.
