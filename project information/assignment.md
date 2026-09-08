# Assignment and scope

## Sources

Primary: [official assignment PDF](../reference/superjoin-vit-2026-assignment.pdf), physical PDF pages 1–2. Supporting dataset descriptions: [starter README](../reference/starter-datasets/README.md), [Delhivery README](../reference/starter-datasets/delhivery/README.md), and [macroeconomy README](../reference/starter-datasets/india-macroeconomy/README.md). The user's project brief supplies additional engineering direction.

## Official requirements

Build a working Fact Knowledge Layer that extracts meaningful numerical or semantic facts, links every fact to source evidence, and identifies cross-document corroboration, contradiction, and reconciliation through context. A simple API **or** UI must accept PDFs and expose results. Additional PDFs may be used for evaluation; facts, filenames, schemas tied to the starter domain, and document-specific rules must not be hard-coded.

Include at least one example of each: corroboration across documents, genuine or likely contradiction, apparent contradiction explained by context, and a discovered extraction or reasoning failure with handling or improvement. The first three require both source evidence and system reasoning. A failure may be unresolved if it is honestly explained.

Use Git meaningfully and create a GitHub repository. The final README must contain Setup and Run Instructions, Video Demo, Approach, Limitations and Next Steps, and Additional Notes. The video must be at most three minutes and show a PDF being processed and all four cases. Explain engineering choices, trade-offs, and AI tools used. Keep credentials out of Git. If a paid service is required, provide sufficient sample output and video for evaluation without the author's account. Submission is the repository and video links via the form printed on assignment page 2: https://forms.gle/3fLdBQ2D6Zm2Gqtv7.

The assignment values clear reasoning, grounded facts, ambiguity handling, generalization, and understandable engineering over production polish. Storage, framework, schema, LLM, and output format are open choices. A graph database or visualization alone does not satisfy the challenge.

## User-selected requirements

Use React, preferably Vite; Node.js/Express as the main API, orchestration, and persistence owner; PostgreSQL; and a focused Python processing service using Docling and an LLM API. Preserve structure before extraction. Separate document understanding, extraction, normalization, matching, and relationship reasoning. Structured facts need original wording, typed values, units, time, scope, qualifiers, uncertainty, and provenance. The four application relationship labels are CORROBORATED, CONTRADICTED, RECONCILED, and UNCERTAIN.

Evidence must come from the document pipeline. LLM output cannot create page numbers, document names, or quotations. Deterministic code should handle reliable parsing, conversions, provenance, validation, and candidate filtering. Semantic discovery and contextual interpretation belong to the LLM where needed. Provide an evidence-focused UI and visible processing errors. Do not build the application during this phase.

## Optional extensions and limits

The official brownie points are large PDFs, many PDFs, dynamically evolving fact types, and incremental updates. They are suggestions, not additional requirements. Incremental document processing is a practical proposal after the core vertical slice works. Embeddings, region highlighting, advanced chart interpretation, distributed queues, and graph visualization are optional. Production authentication, internet fact verification, and a chat interface are outside the initial scope.

The assignment refers to three starter PDFs, but this repository contains two independent trios. Proposed default: Delhivery for the main demo; India macroeconomy as a second corpus and domain-transfer test. No requirement says all six must appear in the video. No deadline or prescribed accuracy threshold appears in the supplied two-page assignment.

## Acceptance checklist

| Obligation | Reviewable evidence |
| --- | --- |
| Accept new PDFs | Upload an unseen PDF through the API/UI and observe completion or an actionable error |
| Meaningful facts | Inspect numerical and semantic facts with original and normalized representations |
| Grounding | Follow every accepted fact to actual blocks and uploaded PDF pages |
| Cross-document reasoning | Show both claims, contexts, evidence, and an explanation for each relationship |
| Four cases | Three justified relationship examples plus an actual recorded pipeline failure |
| Generalization | Run the same pipeline against an unrelated PDF without runtime edits |
| Understandability | Reproducible setup, clear architecture, scoped dependencies, and logical Git history |
| Submission | Required README sections, sample outputs if paid API used, GitHub link, and video ≤3 minutes |

The current documentation phase satisfies none of the runtime acceptance tests by itself. Testing documentation identifies future checks and explicitly marks observed discovery limitations.
