import test from "node:test";
import assert from "node:assert";
import { formatDuration, calcCPUPercent } from "../helpers.js";

test("formatDuration returns N/A for null", () => {
  assert.equal(formatDuration(null), "N/A");
});

test("formatDuration converts ms → hours", () => {
  const oneHourMs = 1000 * 60 * 60;
  assert.equal(formatDuration(oneHourMs), "1.00h");
});

test("calcCPUPercent basic computation", () => {
  const stats = {
    cpu_stats: {
      cpu_usage: { total_usage: 200 },
      system_cpu_usage: 1000,
      online_cpus: 2,
    },
    precpu_stats: {
      cpu_usage: { total_usage: 100 },
      system_cpu_usage: 500,
    },
  };

  const result = calcCPUPercent(stats);
  assert.match(result, /^[0-9]+\.[0-9]{2}$/);
});

test("calcCPUPercent handles errors", () => {
  assert.equal(calcCPUPercent({}), "N/A");
});
