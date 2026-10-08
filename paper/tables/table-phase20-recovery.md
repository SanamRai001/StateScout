# Phase 20 Scalability and Recovery

Generated from `results/raw/phase-20-scalability-recovery.json`.

| States | Transitions | Attempts | Injected failures | Duration ms | Heap delta bytes |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 64 | 67 | 67 | 4 | 17.369 | 914280 |
| 128 | 135 | 135 | 8 | 4.498 | 1735656 |
| 256 | 271 | 271 | 16 | 8.277 | 3914000 |

## Checkpoint recovery

- Synthetic interruption/final attempts: 100/271
- Synthetic final states/transitions/failed: 256/271/16
- Synthetic checkpoint bytes: 260141
- Synthetic resumed equals uninterrupted: true
- Corrupted checkpoint rejected: true
- Browser deep replay states/transitions/attempts: 33/32/32
- Browser replay-step observations: 496
- Browser interruption/final attempts: 10/32
- Browser checkpoint bytes: 34747
- Browser resumed equals uninterrupted: true
