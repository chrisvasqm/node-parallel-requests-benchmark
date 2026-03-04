import pLimit from 'p-limit';

// Centralized configuration allows easy adjustments without hunting through code
// and enables environment-based overrides in production setups
const CONFIG = {
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoint: '/posts',
  callsPerTest: 100,
  benchmarkRuns: 10,
  parallelWorkers: 20
} as const;

interface Stats {
  avg: number;
  min: number;
  max: number;
  median: number;
}

async function fetchRequest(url: string): Promise<void> {
  const response = await fetch(url);
  await response.json();
}

async function runSequential(url: string, count: number): Promise<number> {
  const start = performance.now();
  for (let i = 0; i < count; i++) {
    await fetchRequest(url);
  }

  return performance.now() - start;
}

async function runParallel(url: string, count: number, workers: number): Promise<number> {
  const start = performance.now();
  const limit = pLimit(workers);
  const tasks = Array.from({length: count}, () => limit(() => fetchRequest(url)));
  await Promise.all(tasks);
  
  return performance.now() - start;
}

function calculateStats(times: number[]): Stats {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    avg: sum / times.length,
    min: sorted[0],
    max: sorted[times.length - 1],
    median: sorted[Math.floor(sorted.length / 2)]
  };
}

function formatNumber(num: number): string {
  return num.toFixed(2);
}

async function runBenchmarks(): Promise<void> {
  const url = `${CONFIG.baseUrl}${CONFIG.endpoint}`;
  const sequentialTimes: number[] = [];
  const parallelTimes: number[] = [];

  console.log(`🚀 Running benchmark: ${CONFIG.callsPerTest} calls per test, ${CONFIG.benchmarkRuns} runs\n`);

  for (let i = 1; i <= CONFIG.benchmarkRuns; i++) {
    process.stdout.write(`\rProgress: ${i}/${CONFIG.benchmarkRuns}`);

    try {
      sequentialTimes.push(await runSequential(url, CONFIG.callsPerTest));
      parallelTimes.push(await runParallel(url, CONFIG.callsPerTest, CONFIG.parallelWorkers));
    } catch (error) {
      console.error(`\nError on iteration ${i}:`, error);
    }
  }

  const seqStats = calculateStats(sequentialTimes);
  const parStats = calculateStats(parallelTimes);
  const improvement = ((seqStats.avg - parStats.avg) / seqStats.avg) * 100;
  const speedup = (seqStats.avg / parStats.avg).toFixed(2);

  console.log('\n\n');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`📊 BENCHMARK RESULTS - ${CONFIG.benchmarkRuns} RUNS (${CONFIG.callsPerTest} calls each)`);
  console.log(`Endpoint: ${CONFIG.endpoint}\n`);
  console.log('════════════════════════════════════════════════════════════════\n');
  console.log('Configuration          │  Average  │    Min    │    Max    │  Median');
  console.log('───────────────────────┼───────────┼───────────┼───────────┼─────────');

  const seqLabel = 'Sequential';
  const parLabel = `Parallel (${CONFIG.parallelWorkers} workers)`;

  console.log(
    `${seqLabel.padEnd(22)} │ ${formatNumber(seqStats.avg).padStart(8)}ms │ ${formatNumber(seqStats.min).padStart(8)}ms │ ${formatNumber(seqStats.max).padStart(8)}ms │ ${formatNumber(seqStats.median).padStart(7)}ms`
  );

  console.log(
    `${parLabel.padEnd(22)} │ ${formatNumber(parStats.avg).padStart(8)}ms │ ${formatNumber(parStats.min).padStart(8)}ms │ ${formatNumber(parStats.max).padStart(8)}ms │ ${formatNumber(parStats.median).padStart(7)}ms (${formatNumber(improvement)}% faster)`
  );

  console.log('\n════════════════════════════════════════════════════════════════\n');
  console.log(`✨ Summary: Parallel is ${speedup}x faster than sequential on average\n`);
}

runBenchmarks().catch(console.error);
