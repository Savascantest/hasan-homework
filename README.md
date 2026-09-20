# Hasan — English homework workspace

A privacy-safe, lesson-based homework site for Hasan. The public site contains
only learner-facing homework packages. Browser progress stays on the learner's
device, and source-review records remain local and untracked.

## Shared contracts

- The platform uses `architecture-v1-quality-baseline@1` safeguards. It does
  not inherit another student's language, cadence, workload or branding.
- Every dated public package has the required envelope: `id`, `date`, `title`,
  `policyVersion`, and `templateContractVersion`.
- Public packages are immutable once published; add a new dated package instead
  of rewriting an archived one.
- The generated index whitelists only public archive metadata. It never copies
  arbitrary package properties.
- The recursive privacy validator rejects source/meeting identifiers,
  transcripts, teacher evidence, execution evidence, and UUID-shaped values.
  New repositories start clean: there is no legacy-debt mechanism.
- `work/private/` is local-only and ignored. Never commit source material,
  teacher notes, transcripts, receipts, credentials, or exports.
- Browser progress is local-only. It is not synchronized and does not update
  LearnerState without a future explicit, consented validation design.

## Local checks

Student-specific learner UI belongs in `src/templates/`. The included
`default/` implementation is intentionally small; a student repository may add
its own template without changing package privacy or archive validation.

Run `npm run readiness` to validate package privacy and structure, generate the
archive, run the checks, and build the Pages artifact in `dist/`.
