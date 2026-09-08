# Decision log

Status language: **selected** means user-directed or a firm working proposal within that direction; **proposed** means refine during implementation; **deferred** means outside the initial slice; **unresolved** needs input or experiment before its dependent step.

| Decision | Status | Rationale and alternative considered |
| --- | --- | --- |
| Reference folder is primary authority | Selected, user-directed | Prevent generic assumptions from replacing the assignment or actual evidence |
| React / Express / PostgreSQL / Python / Docling | Selected, user-directed | Clear main API and focused processing boundary; official assignment permits other stacks but gives no reason to depart |
| Generic relational fact envelope plus JSONB | Proposed | Evolves to new predicates/qualifiers without per-domain migrations; a fixed financial schema would fail generalization |
| Source assertions retained separately | Selected | Cross-document evidence and conflicts require both original claims; merging into one “truth” loses information |
| Evidence derived from block references | Selected | Model-generated citations are not trustworthy; existing source references still require entailment evaluation |
| Physical PDF page is canonical locator | Selected | Excerpt gaps and two-page spreads invalidate simple printed-page offsets |
| Precision-aware deterministic normalization | Selected | Crore/million and rounded values are comparable without inventing exact equality |
| Candidate filtering before reasoning | Selected | Avoid all-pairs LLM cost while preserving recall for differing values and contexts |
| PostgreSQL jobs, bounded local runner | Proposed | Restart recovery without Redis; an in-memory-only queue would lose work |
| Delhivery primary demo, macroeconomy transfer corpus | Proposed | Three promising core cases in company documents plus substantial context variation in macro reports |
| Explicit UNCERTAIN and failure records | Selected | Missing context should not become a forced label; confidence is not calibrated truth |
| Embeddings / graph UI / advanced highlighting | Deferred | Add only when measured recall or inspection needs justify complexity |

## Trade-offs to preserve

Docling gives a suitable structured conversion starting point, but does not guarantee chart or table accuracy. Evidence existence checks prevent invented locations, not wrong metric-to-cell assignments. Rejecting unsupported facts improves precision but can reduce recall; show rejected counts and coverage limitations. A small runner is understandable but constrains throughput; measure before scaling.

The likely postcode contradiction is more defensible than treating macroeconomic estimate revisions or a director resignation as contradictions. Nevertheless, the cross-document pair spans dates and must retain uncertainty. Supporting same-year passages strengthen it without proving which postal code is correct. A classifier result of UNCERTAIN may be appropriate; the required contradiction case would then remain an explicit demo gap.

## Unresolved inputs and experimental decisions

1. **Implementation authorization:** the user explicitly required a stop after the documentation phase. No application code is part of this deliverable. A later explicit implementation instruction opens milestone 1.
2. **LLM provider/model, credentials, and spending limit:** not specified or tested. A configurable provider adapter is proposed; choose before paid runs. Credentials belong in server environment settings, never committed files.
3. **Development runtime:** Compose and Python 3.12 are proposals. Verify local Docker availability, hardware resources, and pinned Docling/OCR dependencies during setup; installation feasibility is not established here.
4. **Final contradiction and failure selection:** run the actual pipeline. Keep candidate expectations separate from observed results and select a defensible alternative if necessary.
5. **Supplemental documents:** use a genuinely new PDF for generalization when available. If a controlled contradiction fixture is needed, label its authorship and purpose clearly and discuss it before relying on it as the main demo.
6. **GitHub/video/submission:** destination repository, video host, and final publication links are not established. Do not fabricate links or publish during this specification task.

These items do not prevent the documentation from being complete. Most library, API, and UI details can be settled through routine implementation experiments; they do not require repeated user approval.
