# Generative AI Use Disclosure

## Purpose

ICST 2027 permits generative-AI assistance but requires AI-generated content — including text, figures, images, and code — to be disclosed in an anonymized acknowledgments statement identifying the tools, affected material, and extent of use.

This file records the intended StateScout disclosure so AI assistance is not hidden during submission.

## Tool

OpenAI ChatGPT.

## Actual use in StateScout

ChatGPT has been used interactively for:

- research brainstorming and hypothesis refinement;
- implementation assistance and code review;
- generation/refinement of TypeScript research infrastructure, tests, reporting scripts, and documentation;
- experiment-design discussion;
- interpretation and organization of user-run experiment outputs;
- literature-search assistance and novelty-claim narrowing;
- drafting and editing manuscript prose;
- drafting figure specifications and generation code;
- preparation of reproducibility, venue, and submission documentation.

The author executed the local verification commands, supplied the resulting outputs, reviewed project decisions, and retained negative results when experiments falsified earlier assumptions.

ChatGPT did not independently provide the empirical measurements reported in the paper. Reported numerical results come from the frozen StateScout artifact and user-executed experiment outputs.

## Verification responsibilities

The author remains responsible for:

- research questions;
- benchmark labels and ground truth;
- source code accepted into the frozen artifact;
- correctness of experiments;
- numerical results;
- cited literature;
- novelty claims;
- final figures and tables;
- final manuscript wording;
- compliance with venue policies.

The project includes several mechanisms intended to make those responsibilities auditable:

- frozen source/benchmark/test Git-tree identities;
- 75-test correctness suite;
- raw experiment JSON;
- generated-asset SHA-256 manifest;
- bibliography/citation audit;
- preserved negative results;
- separate temporal replication record.

## Draft anonymized ICST acknowledgment

> **Use of generative AI.** OpenAI ChatGPT was used during software development and manuscript preparation for interactive coding assistance, code/documentation review, literature-search assistance, language drafting/editing, and generation/refinement of reporting scripts and figure specifications. The author independently executed and reviewed the experiments, verified all reported numerical results against the frozen research artifact, checked the cited references and claim boundaries, and reviewed all generated or AI-assisted text, code, and figures before inclusion. The frozen source, benchmarks, tests, raw experiment outputs, and reproducibility materials are provided to support independent verification.

## Citation-to-AI requirement

The final submission must also be checked against the IEEE/ICST policy in force on the submission date regarding whether specific sections containing AI-generated text require an explicit citation to the AI system in addition to the acknowledgment.

Do not assume this draft alone is sufficient until the final IEEE policy/template is checked immediately before submission.

## Double-anonymous review

The disclosure in the submitted manuscript must remain anonymized.

It must not mention:

- the author's name;
- the author's GitHub username;
- private conversation identifiers;
- account details.

## Camera-ready

If the paper is accepted, revisit the acknowledgment/disclosure after de-anonymization and ensure it still accurately describes the final camera-ready artifact.
