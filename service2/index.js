import express from "express";
import si from "systeminformation";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Initialize Express app and use text middleware
const app = express();
app.use(express.text());

// Set the port, URL and file path
const PORT = 5000;
const STORAGE_URL = "http://storage:6000/log";
const VSTORAGE_FILE = "/app/vstorage.txt";

// Function to get status record
async function getStatusRecord(serviceName) {
  // Timestamp in ISO 8601 format
  const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  // System uptime (hours)
  const uptimeSeconds = (await si.time()).uptime;
  const uptimeHours = (uptimeSeconds / 3600).toFixed(2);

  // Free disk space in root (MB)
  const disk = await si.fsSize();
  let freeMb = 0;
  if (disk.length > 0) {
    // Use the index 0 which is the root filesystem
    freeMb = Math.round(disk[0].size - disk[0].used) / (1024 * 1024);
    freeMb = Math.round(freeMb);
  }

  return `${serviceName}@${timestamp}: uptime ${uptimeHours} hours, free disk in root: ${freeMb} MBytes`;
}

// Function to write record to vStorage
function writeToVstorage(record) {
  fs.appendFileSync(VSTORAGE_FILE, record + "\n");
}

// GET /status
app.get("/status", async (req, res) => {
  try {
    // Create status record
    const record = await getStatusRecord("Service2");

    // Send the record to Storage
    try {
      await fetch(STORAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: record,
      });
    } catch (err) {
      console.error("Failed to send to storage:", err.message);
    }

    // Write the record to vStorage
    writeToVstorage(record);

    // Return the record
    res.type("text/plain").send(record);
  } catch (err) {
    console.error("Error in /status:", err);
    res.status(500).send("Error generating status");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Service2 running on port ${PORT}`);
});
