# Bibliography Audit

## Purpose

ICST 2027 explicitly requires authors to verify that references exist, contain accurate bibliographic information, and support the cited claims.

This file records the StateScout manuscript bibliography audit.

The manuscript citation checker is mechanical:

```powershell
npm run paper:check-citations
```

At the time of this audit:

```text
Cited keys: 20
Bibliography entries: 20
Missing bibliography keys: none
Uncited bibliography entries: none
```

A mechanical key check is not sufficient by itself. The entries below were also checked against publisher pages, conference records, DBLP, institutional portals, or the paper/preprint record as available.

## Audited references

| Key | Work | Audit status | Primary metadata used |
| --- | --- | --- | --- |
| `memon2003guiripping` | GUI Ripping: Reverse Engineering of Graphical User Interfaces for Testing | verified | WCRE/IEEE/DBLP metadata; DOI 10.1109/WCRE.2003.1287256 |
| `memon2007eventflow` | An Event-Flow Model of GUI-Based Applications for Testing | verified | Wiley STVR 17(3), 137-157; DOI 10.1002/stvr.364 |
| `mesbah2008crawling` | Crawling Ajax by Inferring User Interface State Changes | verified | ICWE 2008 metadata; DOI 10.1109/ICWE.2008.24 |
| `roest2010regression` | Regression Testing Ajax Applications: Coping with Dynamism | verified | ICST 2010, 127-136; DOI 10.1109/ICST.2010.59 |
| `artzi2011framework` | A Framework for Automated Testing of JavaScript Web Applications | verified | ICSE 2011, 571-580; DOI 10.1145/1985793.1985871 |
| `mesbah2012crawljax` | Crawling Ajax-Based Web Applications through Dynamic Analysis of User Interface State Changes | verified | ACM TWEB 6(1), 1-30; DOI 10.1145/2109205.2109208 |
| `dallmeier2012webmate` | WebMate: A Tool for Testing Web 2.0 Applications | verified | JSTools 2012, 11-15; DOI 10.1145/2307720.2307722 |
| `fard2013feedback` | Feedback-Directed Exploration of Web Applications to Derive Test Models | verified | ISSRE 2013, 278-287; DOI 10.1109/ISSRE.2013.6698880 |
| `mariani2014autoblacktest` | Automatic Testing of GUI-Based Applications | verified | Wiley STVR 24(5), 341-366; DOI 10.1002/stvr.1538 |
| `benbassat2019minhash` | Locality-Sensitive Hashing for Efficient Web Application Security Testing | verified | ICISSP 2019, 193-204; DOI 10.5220/0007255301930204 |
| `gu2019ape` | Practical GUI Testing of Android Applications via Model Abstraction and Refinement | verified | ICSE 2019, 269-280; DOI 10.1109/ICSE.2019.00042 |
| `mulders2022statemodel` | State Model Inference Through the GUI Using Run-Time Test Generation | verified | RCIS 2022, 546-563; DOI 10.1007/978-3-031-05760-1_32 |
| `yandrapally2023fraggen` | Fragment-Based Test Generation for Web Apps | verified | IEEE TSE 49(3), 1086-1101; DOI 10.1109/TSE.2022.3171295 |
| `pastorricos2023distributed` | Distributed State Model Inference for Scriptless GUI Testing | verified | JSS 200, 111645; DOI 10.1016/j.jss.2023.111645 |
| `zhou2024webarena` | WebArena: A Realistic Web Environment for Building Autonomous Agents | verified | ICLR 2024 / OpenReview record |
| `drouin2024workarena` | WorkArena: How Capable are Web Agents at Solving Common Knowledge Work Tasks? | verified | ICML 2024 / PMLR 235, 11642-11662 |
| `chezelles2024browsergym` | The BrowserGym Ecosystem for Web Agent Research | verified as preprint | arXiv:2412.05467; DOI 10.48550/arXiv.2412.05467 |
| `liu2026judge` | Judge: Effective State Abstraction for Guiding Automated Web GUI Testing | verified | ACM TOSEM 35(3), Article 73; DOI 10.1145/3736162 |
| `kanaththage2026webembed` | Neural Embeddings for Web Testing | verified | ICST 2026, 364-375; DOI 10.1109/ICST69053.2026.00056 |
| `liu2026understanding` | Understanding Automated Web GUI Testing: An Empirical Study Across Exploration Strategies and State Abstractions | verified as preprint | arXiv:2606.16650; DOI 10.48550/arXiv.2606.16650 |

## Claim-support audit

The bibliography is not included merely to establish topic similarity.

The manuscript uses the references for the following bounded claims:

- Memon: automatic GUI reverse engineering and event-flow models are prior art.
- Crawljax / Mesbah: URL-independent dynamic web state-flow crawling is prior art.
- Roest: configurable handling of AJAX dynamism/noise before comparison is prior art.
- ARTEMIS / FEEDEx / AutoBlackTest / WebMate / TESTAR: automated or feedback-guided GUI/web exploration is prior art.
- MinHash / FragGen / WebEmbed / Judge: web state abstraction and near-duplicate classification are prior art.
- APE: online abstraction refinement/coarsening and model rebuilding under changed abstraction are prior art.
- WebArena / WorkArena / BrowserGym: semantic/accessibility-oriented web observations and browser-agent action spaces are established adjacent practice.
- Liu et al. 2026 empirical study: exploration strategy and state abstraction remain active, interacting dimensions rather than one universally dominant design.

## APE novelty correction

Citation chaining found APE after the initial StateScout novelty framing.

APE is material because it dynamically refines and coarsens a GUI abstraction during testing and rebuilds its model from recorded GUI trees/transitions.

Therefore the paper does **not** claim novelty for:

- changing an abstraction during testing in general;
- refining/coarsening state abstractions;
- rebuilding a historical model under a changed abstraction;
- reversible projection/rebuilding in isolation.

The candidate StateScout novelty is narrowed to the explicit **cross-run rule-trust lifecycle**:

- run-frozen identity;
- quarantined candidate evidence;
- cross-session behavior-backed delayed promotion;
- provenance and freshness;
- challenged/revoked/cooldown/restored trust;
- selective revalidation under a fixed budget;
- preserved historical evidence under later trust changes.

## Final-submission recheck

Before PDF submission:

1. rerun `npm run paper:check-citations`;
2. resolve every DOI in the final PDF bibliography;
3. verify 2026 publication metadata again because recent records may be corrected;
4. verify whether BrowserGym has acquired a final archival venue record and update the entry if appropriate;
5. check all author accents and capitalization after conversion to the IEEE bibliography style;
6. ensure every cited reference supports the exact surrounding claim, not merely the general topic.
