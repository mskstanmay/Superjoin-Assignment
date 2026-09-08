# Reference inspection and evidence register

## Method and limits

Read the full two-page official assignment and all three dataset READMEs. Opened all six starter PDFs with PyMuPDF, inspected page counts and text availability, searched overlapping factual themes, and read selected passages and tables. Rendered the annual report address/financial pages, the earnings deck chart page, and the IMF cover to check visual layout against extracted text. This is targeted repository discovery, not a complete audit of the roughly 1.70 million extracted characters or a benchmark of Docling.

PyMuPDF was used only as an inspection utility. The intended application must still use Docling. Docling was not installed in the inspected Python environment; no dependencies were installed and no LLM calls were made. Temporary page renders were placed outside the repository.

## Inventory

All paths below are relative to `reference/`. Counts refer to physical pages in the supplied files.

| File | Pages | Bytes | Extracted text characters | Contents and structures |
| --- | ---: | ---: | ---: | --- |
| `superjoin-vit-2026-assignment.pdf` | 2 | Not recorded | Full brief read | Requirements, evaluation, submission checklist |
| `starter-datasets/delhivery/01-delhivery-prospectus-2022-excerpt.pdf` | 100 | 1,597,612 | 329,348 | Corporate history, directors, addresses, historical financial/operational tables, footnotes |
| `starter-datasets/delhivery/02-delhivery-annual-report-fy24-excerpt.pdf` | 100 | 6,679,023 | 611,268 | Financial statements, operations, governance, sustainability, tables, charts, two-page spreads |
| `starter-datasets/delhivery/03-delhivery-q4-fy24-earnings-presentation.pdf` | 27 | 1,988,328 | 21,973 | FY and quarter metrics, charts, financial bridges, operating definitions |
| `starter-datasets/india-macroeconomy/01-india-economic-survey-2024-25-excerpt.pdf` | 89 | 3,920,928 | 203,121 | Economy, external sector, inflation, charts, estimates, sources and methodological notes |
| `starter-datasets/india-macroeconomy/02-rbi-annual-report-2024-25-excerpt.pdf` | 100 | 1,507,769 | 273,836 | Assessment, economic review, macroeconomic appendix, dense grouped tables |
| `starter-datasets/india-macroeconomy/03-imf-india-2025-article-iv-excerpt.pdf` | 95 | 4,305,245 | 260,209 | Press release, staff report, projections, statistical tables, annexes, assumptions |

Total starter pages: 511. The six PDFs are not a uniform finance-only dataset: facts include roles, changes of status, locations, shipments, populations, inflation measures, forecasts, and policy targets. Generic subject/predicate/value assertions with typed qualifiers are needed.

## Curation and page numbering

The dataset READMEs provide original-source links and these retained original PDF pages:

| Supplied excerpt | Original PDF pages retained |
| --- | --- |
| Prospectus | 1, 4, 26–37, 94–120, 216–245, 250–278 |
| Annual report | 2–64, 105–141 |
| Earnings deck | Complete, 27 pages |
| Economic Survey | 4–6, 46–78, 124–176 |
| RBI report | 9–13, 27–111, 307–316 |
| IMF report | 1–95 |

Store three concepts separately: physical uploaded PDF page, optional original PDF page when explicitly supplied, and optional printed page label. The annual report has two printed pages per physical page: uploaded page 22 contains printed 42–43; uploaded page 51 contains printed 100–101. The address row is on printed 100. A single integer `printed_page` is insufficient for spreads. Do not apply a global offset or copy these curation mappings into generic runtime behavior. Optional mappings belong in corpus metadata with the README as their source.

The prospectus is dated May 14, 2022 on its cover. The IMF local press release (PDF page 3) is dated November 26, 2025, while its README links to a publication URL dated November 25; preserve the dates with their roles rather than treating the URL date as the date of every statement. A reporting year is not a publication date or a universal claim-validity interval.

## Evidence register

All page references in this register are physical pages of the supplied PDF. Values listed here are manually inspected anchors for testing, not expected runtime output or extraction rules.

### D1: Corroboration with units and precision

Annual report page 22: consolidated FY ended March 31, 2024, revenue from operations **₹81,415.38 million**. Page 36 also labels this amount revenue from contracts with customers. Earnings deck page 23: total revenue from customers, FY24 column, **₹8,142 crore**. Deck page 6 reports FY24 revenue from services at the same rounded value; annual page 4 reports revenue from services **₹81,415 million**.

One crore equals ten million. The detailed annual value is ₹8,141.538 crore, which rounds to ₹8,142 crore. The original values must remain visible; normalization does not make the two decimal numbers exactly identical. Confirm matched scope and the revenue definition using table headings and deck notes. Service revenue and operations revenue should not become unconditional global synonyms: traded goods appear in other years. Alternative simple corroboration: annual page 4 and deck page 6 both report **740 million FY24 express parcels**.

### D2: Likely contradiction, unresolved postal detail

Prospectus page 30, Corporate Office of our Company: **Plot 5, Sector 44, Gurugram 122002 Haryana, India**. Annual report page 51, BRSR general disclosures item 5: **Plot No. 5, Sector 44, Gurugram, Haryana 122001**. This row was visually verified.

Supporting evidence inside the annual report: pages 30–31 give the same corporate office with **122002**, as does correspondence information on page 47. These contemporaneous supporting passages strengthen a likely inconsistent postal-code assertion and reduce the plausibility that the entire office moved between 2022 and 2024. They do not prove which code is correct or exclude a postal reclassification. Preserve the conflict as likely, cite the supporting third evidence, and allow UNCERTAIN if sufficient context is absent. Do not silently normalize different postcodes into one address value. The intra-report mismatch supports the investigation but does not replace the required cross-document pair.

### D3: Reconciliation through time

Prospectus pages 30 and 84 identify **Sandeep Kumar Barasia** as Executive Director and Chief Business Officer as of the prospectus date. Annual report page 39 states that after March 31, 2024, he resigned from that office **with effect from July 1, 2024**, for personal reasons. These assertions can both hold. The term described in 2022 is not proof that he must remain in office until its planned end. Normalize a role assertion and a role-ending event, retaining their respective temporal semantics.

Simpler numerical alternative: annual report page 4 has FY24 revenue from services of **₹81,415 million**, while deck page 7 has **Q4 FY24 ₹2,076 crore**. The periods differ; a quarter being part of an annual period is not itself conflicting. Do not annualize the quarter or assert an accounting reconciliation without supporting inputs.

### M1: Macroeconomic corroboration

RBI page 39 says headline inflation averaged **4.6 per cent during 2024–25**. RBI appendix page 95, General Index / Combined / 2024–25, also gives **4.6**. IMF page 10 states **4.6 percent (FY2024/25 average)** for headline inflation. IMF table on page 44 identifies consumer prices, Combined, period average. This tests table-to-prose matching and CPI population qualifiers.

RBI page 12 gives forex reserves **US$668.3 billion at end-March 2025**; IMF page 53 gives **$668.3 billion at end-FY2024/25**. IMF page 45 explicitly says fiscal years run April–March, supporting the date alignment.

### M2: Vintage and methodology reconciliation

Economic Survey pages 4 and 14 report real GDP growth estimated at **6.4% for FY25**, explicitly First Advance Estimates. RBI pages 8, 23–24 report **6.5% for 2024–25**; IMF pages 3 and 10 report **6.5% for FY2024/25**. Different estimate vintages are a plausible explanation, not proof of a genuine contradiction. Retain the estimate status and reporting vintage; verify the source notes before claiming a specific revision lineage.

RBI page 12 says reserves cover **11 months of merchandise imports**. IMF page 45 reports **8.4 months of next year's imports (goods and services)** for 2024/25. The denominators and time basis differ. The scalar unit “months” does not make them directly comparable.

RBI page 17 projects FY2025–26 growth of **6.5%**, whereas IMF page 13 projects **6.6%** with a stated tariff baseline. Different publishers, dates, and assumptions make this a forecast difference, not a verified contradiction.

## Observed extraction limitations and Docling implications

IMF page 1 returns zero characters under PyMuPDF `get_text('text')`; its rendered image clearly contains the report title. This is a real baseline text-extraction failure detected by a zero-text check and visual review. No application/Docling failure has yet been observed. Test OCR recovery and document metadata grounding later.

Deck page 9 mixes chart values, years, labels, units, and segment percentages in ordinary extracted text. Its visual layout associates 1,429 with FY24 PTL tonnage and 1,517 with FY24 PTL revenue; linear text alone obscures those associations. This is an observed structural loss and a potential wrong-metric extraction failure, not a measured LLM misclassification.

The annual report contains wide spreads, multiple columns, grouped year/scope headers, parenthesized negatives, and footnotes. RBI page 95 has Rural/Urban/Combined group headers and ellipses explicitly meaning missing/not compiled values. Footnotes in the deck distinguish permanent/contract workers from partner agents and quarter-active customers from other counts. Charts and dense tables need region-aware structure, repeated headers when chunked, explicit unit inheritance, and evidence on qualifiers as well as on the number. Low text content alone does not imply failure: the deck also contains title/divider slides with very little text.
