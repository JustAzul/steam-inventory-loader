/**
 * Markdown table formatter for benchmark results.
 */

/**
 * Format a markdown table.
 * @param {string[]} headers
 * @param {string[][]} rows
 */
export function formatTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length)),
  );

  const headerLine = '| ' + headers.map((h, i) => h.padEnd(widths[i])).join(' | ') + ' |';
  const separator = '| ' + widths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  const dataLines = rows.map(
    row => '| ' + row.map((cell, i) => (cell ?? '').padEnd(widths[i])).join(' | ') + ' |',
  );

  return [headerLine, separator, ...dataLines].join('\n');
}

/**
 * Return PASS or FAIL based on comparison.
 */
export function passFail(value, target, op = '<') {
  switch (op) {
    case '<': return value < target ? '✅ PASS' : '❌ FAIL';
    case '>': return value > target ? '✅ PASS' : '❌ FAIL';
    case '<=': return value <= target ? '✅ PASS' : '❌ FAIL';
    default: return value === target ? '✅ PASS' : '❌ FAIL';
  }
}
