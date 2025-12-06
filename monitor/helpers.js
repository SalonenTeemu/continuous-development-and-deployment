/**
 * Function to format duration from milliseconds to minutes.
 * @param {*} ms - Time duration in milliseconds
 * @returns {string} - Formatted duration in minutes or "N/A" if input is null
 */
export function formatDuration(ms) {
  if (ms == null) return "N/A";

  const totalMinutes = ms / (1000 * 60);
  return Math.round(totalMinutes) + " minutes";
}

/**
 * Function to calculate CPU usage percentage from Docker stats.
 * @param {*} stats - Docker container stats object
 * @returns {string} - CPU usage percentage as a string with two decimal places or "N/A" if calculation fails
 */
export function calcCPUPercent(stats) {
  try {
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta =
      stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuCount = stats.cpu_stats.online_cpus || 1;
    return ((cpuDelta / systemDelta) * cpuCount * 100).toFixed(2);
  } catch {
    return "N/A";
  }
}
