# Design QA

- Source visual truth: `/var/folders/_l/lyz80jpj57s7zsgl102k25lw0000gp/T/codex-clipboard-ed9ac04e-8956-44db-ba30-a29c81cbaee9.png`
- Implementation screenshot: current Codex in-app Browser capture for `http://localhost:3000/`, shown inline in the implementation turn. The browser capture API did not expose a persistent filesystem path.
- Viewport: 319 × 772 CSS pixels at device pixel ratio 2.
- Source pixels: 1992 × 1068.
- Implementation capture: 638 × 1544 physical pixels. The comparison was normalized around the top-right action cluster because the supplied reference depicts a different product and a wider viewport.
- State: certificate editor, light mode, editable state and preview state.
- Primary interactions tested: entering preview with the eye button and returning to the editor with the eye-off button.
- Browser console errors: none observed.

## Full-view comparison evidence

The existing certificate editor remains intact. Its top-right actions now follow the reference hierarchy: a compact square icon control, a neutral text action, and a high-emphasis primary Publish action. The action cluster remains fully visible without wrapping at the 319px test viewport.

## Focused region comparison evidence

The reference action region was compared with the rendered editor toolbar. Both use a square icon-only preview control followed by two text buttons. `Save as draft` uses the neutral secondary surface, while `Publish` retains the application's primary black token rather than copying the unrelated product's blue brand color. The preview icon changes from eye to eye-off in the active state and exposes a matching accessible label.

## Required fidelity surfaces

- Fonts and typography: existing application typography is preserved; both action labels remain single-line and readable.
- Spacing and layout rhythm: the three controls share a 36px height and 8px gaps, matching the compact toolbar rhythm in the reference.
- Colors and visual tokens: neutral and primary hierarchy matches the reference while using Sertiva's existing theme tokens.
- Image quality and asset fidelity: no raster asset is required for this toolbar. Preview uses the project's existing Lucide icon system and renders sharply.
- Copy and content: the actions read `Save as draft` and `Publish`; preview uses an accessible icon-only label rather than visible text.

## Findings

No actionable P0, P1, or P2 differences remain for the requested action-cluster adaptation.

## Comparison history

1. The previous implementation used a labeled Preview button plus icons inside all three actions, which did not match the compact reference hierarchy.
2. Preview was converted to a square eye/eye-off toggle, and the Save as draft and Publish icons were removed.
3. Post-fix browser evidence shows the compact cluster fits at 319px and the preview state toggles correctly in both directions.

## Follow-up polish

- P3: At very narrow widths, the certificate title truncates before the actions; this preserves action availability and matches the editor's existing responsive priority.

prior result: passed

---

# Certificate grid QA — 2026-10-12

- Source visual truth: `/var/folders/_l/lyz80jpj57s7zsgl102k25lw0000gp/T/codex-clipboard-81c04373-094e-43fd-b1ff-525da2956954.png` (1906 × 948 pixels).
- Implementation screenshot: Codex browser capture of `http://localhost:3000/dashboard`, displayed inline in the comparison call. The browser capture API did not provide a persistent file path.
- Viewports: 1512 × 827 desktop and 390 × 844 mobile CSS pixels. Both captures were displayed at 1:1 CSS scale; the source is a wider reference with no app sidebar, so the card region was compared rather than the full viewport pixel-for-pixel.
- State: signed-in dashboard with one existing landscape PDF certificate. The reference has three portrait items; the difference in record count and artwork is source content, not generated filler.
- Primary interactions tested: opening the certificate card, returning to the grid, opening the delete confirmation, and cancelling it. No data was deleted.
- Browser console errors: none observed.

## Full-view comparison evidence

The source and browser capture were emitted together in one comparison input. Both use a clean, unboxed grid with large rounded preview surfaces and item details beneath. The implementation retains the app sidebar and dashboard header and lays out three equal grid tracks at desktop width (computed widths: 381.328, 381.336, and 381.336 CSS pixels). One actual certificate occupies the first track.

## Focused region comparison evidence

The source's preview cards are portrait because its example documents are portrait. The uploaded certificate is landscape, so the implementation uses a 4:3 preview surface with contained artwork rather than cropping or shrinking it into a tall card. The title, file name, edited date, PDF badge, and delete action remain readable beneath the preview. At 390px, the card fills a single column without horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: the app's existing font is preserved; card titles have stronger hierarchy than file/date metadata. Source text is larger because the reference is shown without a sidebar and at a wider content scale.
- Spacing and layout rhythm: generous gaps and rounded preview edges match the reference's gallery treatment. The 4:3 preview ratio is an intentional adjustment for certificate artwork.
- Colors and visual tokens: white surfaces, subtle gray borders, muted metadata, and the existing black primary action stay consistent with Sertiva's light theme.
- Image quality and asset fidelity: the real uploaded PDF preview is shown with `contain`, preserving the complete design without crop or a placeholder.
- Copy and content: certificate name, original file name/format, and last-edited date are retained from the prior list because they are operationally relevant. The source's “Free” and “Viewed” labels are not copied because they describe a different product.

## Findings and comparison history

1. Initial 4:5 preview left excessive whitespace around the landscape certificate (P2). Changed the gallery preview to 4:3. The post-fix browser capture shows the certificate filling the frame clearly, with modest margins.
2. No actionable P0, P1, or P2 issues remain for this scoped grid conversion. Only one real record was available, so the second and third tracks were validated from computed grid styles rather than live multi-record imagery.

## Follow-up polish

- P3: A future mixed portrait/landscape library could offer a density preference, but the current contained previews preserve every uploaded design.

prior result: passed

---

# Attached certificate cards QA — 2026-10-12

- Source visual truth: `/var/folders/_l/lyz80jpj57s7zsgl102k25lw0000gp/T/codex-clipboard-7f436e28-1f2a-4026-b7b2-865c008b3576.png` (2494 × 1018 source pixels).
- Implementation screenshot: Codex in-app browser full-page capture of `http://localhost:3000/dashboard`, emitted beside the source image in the comparison call. The browser capture API did not expose a persistent file path.
- Viewports: implementation 1600 × 900 desktop CSS pixels, default 483px-wide in-app mobile panel, and a 900 × 800 tablet breakpoint check. Source has no app chrome and a wider layout, so comparison focused on the card region and proportions rather than exact page pixels.
- State: signed-in dashboard, light mode, one real landscape PDF certificate. The source shows eight different designs in dark mode; those are reference content, not Sertiva records.
- Primary interactions tested: open card, return to list, open delete confirmation, cancel deletion. No certificate data was changed.
- Browser console errors: none observed.

## Full-view comparison evidence

Both source and implementation use a four-column wide-preview gallery with an attached metadata strip. At 1600px, the implementation computes four equal 306px tracks, with two columns at 900px and one in the mobile panel. The existing sidebar and header stay in place. The dashboard remains light mode to honor the earlier product direction; only the reference's card geometry and hierarchy were adopted.

## Focused region comparison evidence

The source card uses a roughly 16:9 visual preview above a compact footer. The implementation now uses the same preview ratio, one continuous rounded card border, a divider at the footer, a leading file icon, title, muted format/edit metadata, and a trailing delete action. The real certificate preview is fully contained, not cropped. The reference's decorative thumbnail art and avatars were not copied because they represent unrelated files and users.

## Required fidelity surfaces

- Fonts and typography: Sertiva's Timeless Sans Grotesk remains in use. The title is medium-weight and the metadata is smaller and muted, matching the reference hierarchy at the app's card scale.
- Spacing and layout rhythm: wide 16:9 card tops, attached footers, 16px corners, and consistent grid gaps match the reference structure. The dashboard is not artificially constrained to the previous 1280px max width.
- Colors and visual tokens: light surfaces and thin neutral borders deliberately preserve the requested light mode; the source's charcoal background is not imported into the dashboard.
- Image quality and asset fidelity: the uploaded PDF preview is the actual saved asset, displayed with `contain` so the whole certificate remains visible. No replacement thumbnail graphics were invented.
- Copy and content: each card shows the real certificate title, file format, and edited date. The original filename remains available in the card's title tooltip and editor.

## Findings and comparison history

1. The previous grid had a detached metadata block and a 4:3 preview (P1 relative to the new source). Replaced it with a single bordered card, 16:9 preview, and attached footer. Post-fix mobile and desktop browser captures show the intended hierarchy.
2. The first desktop pass kept the old max-width and made four cards too narrow (P2). Removed that constraint; post-fix computed tracks widened from 286px to 306px at the 1600px viewport.
3. No actionable P0/P1/P2 differences remain within the light-mode adaptation. Only one live certificate was available, so the four-track layout was checked by computed CSS rather than four live cards.

## Follow-up polish

- P3: If the product later supports both portrait and landscape template galleries, a user-selectable preview density could help mixed collections.

final result: passed
