# Submission Venue Strategy

## Decision date

2026-10-08.

## Primary target: ICST 2027 Research Papers

**20th IEEE International Conference on Software Testing, Verification and Validation**

Conference: 17-21 May 2027, San Sebastian, Spain.

Official research-track page:

https://conf.researchr.org/track/icst-2027/icst-2027-research-papers

### Why ICST is the best immediate target

StateScout is directly about automated web/GUI testing and state abstraction.

The ICST 2027 scope explicitly includes:

- test automation;
- dynamic analysis;
- empirical/case/replication studies;
- testing in web and GUI domains;
- testing tools and software reliability.

The current StateScout artifact also matches ICST's replication expectations unusually well: the research track expects submissions to provide the information/material needed to replicate results and asks for an anonymized replication package.

### Format

ICST 2027 research papers:

- IEEE two-column conference format;
- maximum 10 pages including text, figures, tables, and appendices;
- up to 2 additional reference-only pages;
- full papers only;
- double-anonymous review.

### Dates

All dates are AoE.

- full paper: **2026-11-02**;
- initial decision: **2026-12-22**;
- possible major revision: **2027-01-31**;
- final decision after major revision: **2027-02-20**;
- camera ready: **2027-03-18**.

### GenAI disclosure

ICST 2027 permits generative-AI assistance, but authors remain responsible for all content.

The conference requires disclosure of AI-generated content, including text, figures, images, and code, in an anonymized acknowledgments statement identifying:

- tools used;
- affected sections/artifacts;
- extent of use.

Routine spelling/grammar editing need not be disclosed.

StateScout's submission package must therefore contain an anonymized disclosure consistent with the actual use of ChatGPT during research coding, analysis support, figure/reporting generation, and manuscript drafting.

### Required compression

The current manuscript is much larger than a 10-page IEEE paper.

For ICST, target this approximate body-page budget:

| Material | Target pages |
| --- | ---: |
| Abstract + Introduction | 1.2 |
| Background + Related Work | 1.1 |
| StateScout Design | 2.2 |
| Experimental Methodology | 1.4 |
| Results | 2.2 |
| Discussion + Threats | 1.2 |
| Artifact + Conclusion | 0.7 |
| **Total** | **10.0** |

Figures/tables must be included inside those allocations.

Recommended main-paper assets:

- Figure 1 lifecycle;
- Figure 2 Phase 18 comparison;
- Figure 3 stale-trust/revocation result;
- one compact combined table for lifecycle + recovery results.

Move detailed per-phase mechanics, full tables, reproduction logs, and secondary plots into the anonymized artifact rather than the 10-page body.

---

## Sequential backup: ISSTA 2027 Research Papers

**ACM SIGSOFT International Symposium on Software Testing and Analysis**

Conference: 7-10 September 2027, Singapore.

Official page:

https://conf.researchr.org/track/issta-2027/issta-2027-research-papers

### Current published dates

- mandatory abstract: **2027-01-08**;
- full paper: **2027-01-11**;
- author response: **2027-03-22 to 2027-03-25**;
- initial notification: **2027-04-20**;
- major revision: **2027-05-20**;
- final notification: **2027-06-17**.

As of 2026-10-08, the detailed ISSTA 2027 research-track CFP text is still marked **TBD**.

Do not assume the final 2027 page limit or exact formatting requirements until the organizers publish them.

For planning only, recent ISSTA editions used the ACM `acmsmall` review format and a substantially larger body-page allowance than ICST, which would fit the full StateScout lifecycle story more comfortably. This historical format must be rechecked against the actual 2027 CFP before submission.

---

## Recommended submission sequence

### Plan A

1. Target ICST 2027.
2. Submit by 2026-11-02.
3. Wait for the 2026-12-22 initial decision.

### If ICST accepts

Stop. Continue through ICST camera-ready/artifact evaluation.

### If ICST gives Major Revision

Stay in ICST.

Do **not** submit the manuscript to ISSTA while it remains under ICST review.

Use the five-week revision window and submit the requested revision by 2027-01-31.

### If ICST rejects

Use the reviews immediately.

There are 20 days between the ICST initial decision (2026-12-22) and the ISSTA full-paper deadline (2027-01-11).

Revise the paper and submit to ISSTA 2027, assuming its final CFP and policies are compatible.

This gives StateScout two sequential opportunities without simultaneous submission.

---

## FSE 2027

FSE is relevant to the work, but the 2027 research-paper deadline was 2026-10-02 and has already passed.

It is not a current submission option for this frozen manuscript.

---

## Submission-readiness blockers

Before ICST submission:

- [ ] finish citation chaining and bibliography verification;
- [ ] run `npm run paper:check-citations`;
- [ ] convert manuscript to IEEE two-column template;
- [ ] compress to <=10 body pages;
- [ ] ensure all figures remain legible at column/page width;
- [ ] anonymize repository/artifact;
- [ ] create anonymized replication-package link;
- [ ] rerun frozen controlled reproduction from a clean checkout;
- [ ] archive exact raw outputs and paper assets;
- [ ] verify freeze manifest;
- [ ] include threats-to-validity discussion;
- [ ] prepare required GenAI-use disclosure;
- [ ] have at least one independent reader critique novelty and claims;
- [ ] verify every DOI/reference manually or against a primary bibliographic source.

## Current recommendation

**Submit to ICST 2027 first.**

Reason:

- strongest topical fit;
- current paper is already mature enough for a concentrated 10-page research submission;
- artifact/reproducibility expectations match StateScout's strongest engineering property;
- the decision arrives before the ISSTA 2027 deadline, enabling a clean sequential fallback if rejected.
