// Progressive coverage thresholds. Used by Jest/Vitest configs.
const coverageTargets = {
  '2025-01': { branches: 40, functions: 40, lines: 40, statements: 40 },
  '2025-02': { branches: 50, functions: 50, lines: 50, statements: 50 },
  '2025-03': { branches: 60, functions: 60, lines: 60, statements: 60 },
  '2025-04': { branches: 70, functions: 70, lines: 70, statements: 70 },
  '2025-05': { branches: 80, functions: 80, lines: 80, statements: 80 },
};

const currentMonth = new Date().toISOString().slice(0, 7);
const threshold = Object.entries(coverageTargets)
  .filter(([month]) => month <= currentMonth)
  .pop()?.[1] || coverageTargets['2025-01'];

module.exports = threshold;
