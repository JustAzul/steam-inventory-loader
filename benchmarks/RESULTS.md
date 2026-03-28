# Benchmark Results — v4.0.0

Ran on Docker containers (WSL2, same host) — 2026-03-28.
Each scenario uses fixture data with 0ms network delay.

## Scenario Benchmarks (77k items, 39 pages)

| Node | Version | Empty | 1 page (2k) | 5 pages (10k) | 39 pages (77k) |
|------|---------|-------|-------------|---------------|----------------|
| 18 | v18.20.8 | 0.03ms | 8.49ms | 39.86ms | 398.29ms |
| 20 | v20.20.2 | 0.03ms | 5.77ms | 30.08ms | 366.72ms |
| 22 | v22.22.2 | 0.03ms | 6.93ms | 29.44ms | 379.69ms |
| 24 | v24.14.1 | 0.03ms | 4.89ms | 28.81ms | 317.55ms |

Node 24 is ~20-25% faster than Node 18 on the large scenario.

## Memory — 500k Items (Field Selection ON)

| Node | Heap Delta | PRD Target | Status |
|------|-----------|------------|--------|
| 18 | 81.3MB | <175MB | PASS |
| 20 | 81.4MB | <175MB | PASS |
| 22 | 81.4MB | <175MB | PASS |
| 24 | 81.5MB | <175MB | PASS |

Memory usage is consistent across all versions (~81MB for 500k items).

## Field Selection Reduction

| Node | All fields | 7 fields | Reduction |
|------|-----------|----------|-----------|
| 18 | 59.3MB | 36.3MB | 38.8% |
| 20 | 59.3MB | 36.3MB | 38.7% |
| 22 | 64.5MB | 38.1MB | 40.9% |
| 24 | 63.3MB | 38.1MB | 39.7% |

## Cache Hit Latency (1000 hits)

| Node | p50 | p99 | PRD Target | Status |
|------|-----|-----|------------|--------|
| 18 | 0.00ms | 0.01ms | <1ms p99 | PASS |
| 20 | 0.00ms | 0.00ms | <1ms p99 | PASS |
| 22 | 0.00ms | 0.00ms | <1ms p99 | PASS |
| 24 | 0.00ms | 0.01ms | <1ms p99 | PASS |

## Concurrent Workers (5 x 77k)

| Node | Sequential | Concurrent | Speedup |
|------|-----------|------------|---------|
| 18 | 2066ms | 4312ms | 0.5x |
| 20 | 1932ms | 3859ms | 0.5x |
| 22 | 1913ms | 3638ms | 0.5x |
| 24 | 1703ms | 2935ms | 0.6x |

Fixture benchmarks have 0ms network delay so worker spawn overhead (~80ms) is not hidden.
In production with real network latency (200ms-4s per page), POC B3 showed 3.6x speedup.

## Network Latency — Sequential vs Workers (5 x 77k)

Workers break even at ~10ms network latency per page. Below that, spawn overhead
(~80ms) and structured clone cost make workers slower than sequential.

| Network Latency | Sequential (5×77k) | Workers (5×77k) | Speedup |
|-----------------|---------------------|------------------|---------|
| 0ms | 1,629ms | 3,023ms | 0.5x (workers hurt) |
| 10ms | 3,244ms | 2,944ms | 1.1x (break-even) |
| 25ms | 6,235ms | 3,085ms | 2.0x |
| 50ms | 11,248ms | 3,678ms | 3.1x |
| 100ms | 21,157ms | 4,985ms | 4.2x |
| 200ms | 40,935ms | 8,954ms | 4.6x |

Real Steam API latency is 100-200ms+ per page, so workers deliver 4-5x speedup
in production when concurrency threshold is met (≥3 active loads, ≥5k items).

## How to reproduce

```bash
# Single version (local)
node --expose-gc benchmarks/run.js

# All LTS versions (Docker)
for ver in 18 20 22 24; do
  docker run --rm -v "$(pwd)":/app -w /app node:${ver}-slim \
    sh -c "npm ci --silent && npm run build --silent && node --expose-gc benchmarks/run.js"
done
```
