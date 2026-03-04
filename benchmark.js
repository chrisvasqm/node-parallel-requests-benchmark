import { execSync } from 'child_process';

const ITERATIONS = 10;

console.log(`🚀 Running benchmark for ${ITERATIONS} iterations...\n`);

const timingsByWorkers = {
  sequential: [],
  parallel_2: [],
  parallel_3: [],
  parallel_4: [],
  parallel_5: [],
  parallel_6: [],
};

for (let i = 1; i <= ITERATIONS; i++) {
  process.stdout.write(`\rProgress: ${i}/${ITERATIONS}`);

  try {
    const output = execSync('node client.js', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Parse timing data using regex
    const sequentialMatch = output.match(/Sequential:\s+(\d+\.?\d*)/);
    const parallel2Match = output.match(/Parallel \(2 workers\):\s+(\d+\.?\d*)/);
    const parallel3Match = output.match(/Parallel \(3 workers\):\s+(\d+\.?\d*)/);
    const parallel4Match = output.match(/Parallel \(4 workers\):\s+(\d+\.?\d*)/);
    const parallel5Match = output.match(/Parallel \(5 workers\):\s+(\d+\.?\d*)/);
    const parallel6Match = output.match(/Parallel \(6 workers\):\s+(\d+\.?\d*)/);

    if (sequentialMatch) timingsByWorkers.sequential.push(parseFloat(sequentialMatch[1]));
    if (parallel2Match) timingsByWorkers.parallel_2.push(parseFloat(parallel2Match[1]));
    if (parallel3Match) timingsByWorkers.parallel_3.push(parseFloat(parallel3Match[1]));
    if (parallel4Match) timingsByWorkers.parallel_4.push(parseFloat(parallel4Match[1]));
    if (parallel5Match) timingsByWorkers.parallel_5.push(parseFloat(parallel5Match[1]));
    if (parallel6Match) timingsByWorkers.parallel_6.push(parseFloat(parallel6Match[1]));
  } catch (error) {
    console.error(`\nError on iteration ${i}:`, error.message);
  }
}

console.log('\n\n');

/**
 * Helper function to calculate statistics
 */
function getStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = sorted[0];
  const max = sorted[times.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];

  return { avg, min, max, median, count: times.length };
}

/**
 * Format a number with proper decimals
 */
function format(num) {
  return num.toFixed(2);
}

// Display results
console.log('════════════════════════════════════════════════════════════════');
console.log('📊 BENCHMARK RESULTS - 100 ITERATIONS');
console.log('════════════════════════════════════════════════════════════════\n');

const configs = [
  { key: 'sequential', label: 'Sequential' },
  { key: 'parallel_2', label: 'Parallel (2 workers)' },
  { key: 'parallel_3', label: 'Parallel (3 workers)' },
  { key: 'parallel_4', label: 'Parallel (4 workers)' },
  { key: 'parallel_5', label: 'Parallel (5 workers)' },
  { key: 'parallel_6', label: 'Parallel (6 workers)' },
];

console.log('Configuration          │  Average  │    Min    │    Max    │  Median');
console.log('───────────────────────┼───────────┼───────────┼───────────┼─────────');

const baselineAvg = getStats(timingsByWorkers.sequential).avg;

for (const { key, label } of configs) {
  const stats = getStats(timingsByWorkers[key]);
  const improvement = key === 'sequential' ? '' : ` (${format(((baselineAvg - stats.avg) / baselineAvg * 100))}% faster)`;
  console.log(
    `${label.padEnd(22)} │ ${format(stats.avg).padStart(8)}ms │ ${format(stats.min).padStart(8)}ms │ ${format(stats.max).padStart(8)}ms │ ${format(stats.median).padStart(7)}ms${improvement}`
  );
}

console.log('\n════════════════════════════════════════════════════════════════\n');

// Summary insight
const stats6Workers = getStats(timingsByWorkers.parallel_6);
const statsSeq = getStats(timingsByWorkers.sequential);
const speedup = (statsSeq.avg / stats6Workers.avg).toFixed(2);

console.log(`✨ Summary: 6 workers is ${speedup}x faster than sequential on average\n`);
