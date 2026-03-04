# Node Parallel Requests Benchmark

A lightweight benchmarking tool that compares the performance of sequential vs. parallel HTTP requests in Node.js.

## Overview

This project benchmarks HTTP request handling patterns by measuring how much faster parallel execution with controlled concurrency is compared to sequential execution. It hits a public REST API multiple times in different execution patterns and reports detailed timing statistics.

## Quick Start

### Prerequisites
- Node.js (v18+)
- pnpm (package manager specified in package.json)

### Installation

```bash
pnpm install
```

### Run Benchmark

```bash
pnpm start
```

This will execute the benchmark using the default configuration and display results showing:
- Average, min, max, and median execution times
- Performance improvement percentage
- Speedup factor (how many times faster parallel execution is)

## Customization

Edit the `CONFIG` object at the top of [app.ts](app.ts) to experiment with different parameters:

```typescript
const CONFIG = {
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoint: '/posts',
  callsPerTest: 100,
  benchmarkRuns: 10,
  parallelWorkers: 20
};
```

**Key adjustments for experimentation:**
- **`parallelWorkers`**: Try values like 5, 10, 50 to see how concurrency limit affects performance
- **`callsPerTest`**: Increase for more statistically significant results
- **`benchmarkRuns`**: More runs reduce variance in results
- **`baseUrl` & `endpoint`**: Point to different APIs to test real-world scenarios

## How It Works

The benchmark runs for `benchmarkRuns` iterations:
1. **Sequential**: Makes requests one at a time, waiting for each to complete
2. **Parallel**: Makes requests concurrently, limited by `parallelWorkers` using `p-limit`

Results are compared to show the performance gain of parallelization.

## Dependencies

- **express**: HTTP framework (available for potential extensions)
- **p-limit**: Concurrency limiter for controlled parallel execution
- **typescript**: Language and tooling
- **tsx**: TypeScript executor for running `.ts` files directly
