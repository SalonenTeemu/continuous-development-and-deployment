import si from "systeminformation";

/**
 * Create status record for Service2
 * @param {*} deps - Dependency injection for systeminformation (for testing)
 * @returns The status record object and text string
 */
export async function createStatusRecord(deps = si) {
  // Timestamp in ISO 8601 UTC
  const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  // Uptime in seconds
  const uptimeSeconds = (await deps.time()).uptime;

  // Free disk space in MB
  const disk = await deps.fsSize();
  let freeMb = 0;
  if (disk.length > 0) {
    // Use the index 0 which is the root filesystem
    freeMb = Math.round((disk[0].size - disk[0].used) / (1024 * 1024));
  }

  // JSON entry for Storage
  const entry = {
    service: "Service2",
    timestamp,
    uptime_seconds: Math.round(uptimeSeconds),
    free_mb: freeMb,
  };

  // Text string for Service1
  const uptimeMinutes = Math.round(uptimeSeconds / 60);
  const textString = `Service2@${timestamp}: uptime ${uptimeMinutes} minutes, free disk in root: ${freeMb} MBytes`;

  return { entry, textString };
}
