import pLimit from 'p-limit';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const ENDPOINT = '/posts';
const CALLS_PER_TEST = 100;
const BENCHMARK_RUNS = 10;

console.log(`🚀 Running benchmark: ${CALLS_PER_TEST} calls per test, ${BENCHMARK_RUNS} runs\n`);

/**
 * Sequential execution: Call endpoint 100 times one by one
 */
async function sequentialRequests(): Promise<number> {
  const startTime = performance.now();

  try {
    for (let i = 0; i < CALLS_PER_TEST; i++) {
      const response = await fetch(`${BASE_URL}${ENDPOINT}`);
      await response.json();
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }

  return performance.now() - startTime;
}

/**
 * Parallel execution: Call endpoint 100 times with concurrency limit
 */
async function parallelRequests(concurrencyLimit: number): Promise<number> {
  const startTime = performance.now();
  const limit = pLimit(concurrencyLimit);

  try {
    const promises = Array.from({length: CALLS_PER_TEST}, () => {
      return limit(async () => {
        const response = await fetch(`${BASE_URL}${ENDPOINT}`);
        return response.json();
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }

  return performance.now() - startTime;
}

const timingsByType: Record<string, number[]> = {
  sequential: [],
  parallel_20: []
};

/**
 * Main benchmark function
 */
async function runBenchmark(): Promise<void> {
  for (let i = 1; i <= BENCHMARK_RUNS; i++) {
    process.stdout.write(`\rProgress: ${i}/${BENCHMARK_RUNS}`);

    try {
      timingsByType.sequential.push(await sequentialRequests());
      timingsByType.parallel_20.push(await parallelRequests(20));
    } catch (error) {
      console.error(`\nError on iteration ${i}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log('\n\n');

  /**
   * Helper function to calculate statistics
   */
  function getStats(times: number[]): {avg: number; min: number; max: number; median: number; count: number} {
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = sorted[0];
    const max = sorted[times.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];

    return {avg, min, max, median, count: times.length};
  }

  /**
   * Format a number with proper decimals
   */
  function format(num: number): string {
    return num.toFixed(2);
  }

  // Display results
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`📊 BENCHMARK RESULTS - ${BENCHMARK_RUNS} RUNS (${CALLS_PER_TEST} calls each)`);
  console.log(`Endpoint: ${ENDPOINT}\n`);
  console.log('════════════════════════════════════════════════════════════════\n');

  const configs = [
    {key: 'sequential', label: 'Sequential'},
    {key: 'parallel_20', label: 'Parallel (20 workers)'}
  ];

  console.log('Configuration          │  Average  │    Min    │    Max    │  Median');
  console.log('───────────────────────┼───────────┼───────────┼───────────┼─────────');

  const baselineAvg = getStats(timingsByType.sequential).avg;

  for (const {key, label} of configs) {
    const stats = getStats(timingsByType[key]);
    const improvement = key === 'sequential' ? '' : ` (${format(((baselineAvg - stats.avg) / baselineAvg) * 100)}% faster)`;
    console.log(
      `${label.padEnd(22)} │ ${format(stats.avg).padStart(8)}ms │ ${format(stats.min).padStart(8)}ms │ ${format(stats.max).padStart(8)}ms │ ${format(stats.median).padStart(7)}ms${improvement}`
    );
  }

  console.log('\n════════════════════════════════════════════════════════════════\n');

  // Summary insight
  const statsParallel = getStats(timingsByType.parallel_20);
  const statsSeq = getStats(timingsByType.sequential);
  const speedup = (statsSeq.avg / statsParallel.avg).toFixed(2);

  console.log(`✨ Summary: 20 workers is ${speedup}x faster than sequential on average\n`);
}

// Run the benchmark
runBenchmark().catch(console.error);
