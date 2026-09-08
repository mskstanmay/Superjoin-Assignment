# Notes for the final root README

The root README should be written when implementation exists. These notes are not run instructions for a working application. Avoid setup commands for unimplemented scripts and placeholder links presented as real artifacts.

## Setup and Run Instructions

List exact tested runtime versions, platform assumptions, prerequisites, model downloads/cache needs, hardware observations, environment variable names, dependency installation, migrations, start commands, service URLs, and shutdown/restart behavior. Include both fresh database setup and how to recover/retry a failed run. Explain the LLM key requirement and selected provider/model configuration. Provide an `.env.example` with placeholders only.

Verify instructions from a clean checkout. Explain upload limits, supported PDF behavior, and where files/artifacts are stored. Show one real API upload example when implemented. If Compose is the supported path, document the tested command and native development alternatives only if those were actually tested.

## Video Demo

Include a real accessible video link, at most three minutes. Proposed allocation: 0:00–0:30 upload/processing and document state; 0:30–1:00 corroboration with both evidence snippets; 1:00–1:30 likely contradiction with caveat/support; 1:30–2:00 contextual reconciliation; 2:00–2:35 an actual failure and handling; 2:35–2:55 approach/limitations. Adjust to actual latency and clearly label any time cut. A screen recording of saved output cannot substitute for showing a PDF being processed.

## Approach

Explain why Node owns the API/database and Python owns processing; the Docling structured pipeline; the generic assertion schema; normalization and precision; candidate retrieval; contextual reasoning; and source provenance. Describe trade-offs and the role of deterministic logic versus the LLM. Identify AI tools used in development and runtime, including which outputs humans reviewed. Do not claim perfect grounding merely because all IDs resolve.

Link to detailed working specifications as supplementary material, but keep the README understandable on its own. Briefly describe how new documents update existing knowledge and how uncertain/failed results remain visible.

## Limitations and Next Steps

Report observed extraction failures, difficult spreads/tables/charts/OCR, ambiguous time and scope, candidate retrieval misses, model uncertainty, performance/cost, and prototype operational limits. Distinguish tested fixes from proposed improvements. Include the actual failure log and representative before/after outputs. Do not describe baseline PyMuPDF behavior as a measured Docling failure.

## Additional Notes

Credit the reference corpus and link its provenance READMEs. Note excerpt/printed-page numbering. Include enough versioned sample facts, source evidence, relationships, and video footage to evaluate a paid-service implementation without access to the author's account. Saved samples must be labeled, inspectable, and traceable to source files; a sample mode must not pretend to accept/process new PDFs without its required runtime.

Record benchmark corpus, pipeline/model/prompt versions, and evaluation denominators. Review repository contents for secrets and large generated artifacts before publishing. Supply repository/video links through the official form only when ready and authorized; no submission has occurred in this phase.
