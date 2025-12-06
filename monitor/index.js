import express from "express";
import fetch from "node-fetch";
import si from "systeminformation";
import os from "os";
import Docker from "dockerode";
import jwt from "jsonwebtoken";
import { formatDuration, calcCPUPercent } from "./helpers.js";

const app = express();
const PORT = 8198;
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// Set the service1 URL
const SERVICE1_URL = "http://service1_v1_1:5000";

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set. Exiting.");
  process.exit(1);
}

// Serve static files
app.use(express.static("public"));

// JWT authentication middleware
function checkJWT(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = auth.slice(7);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Host metrics
async function getHostMetrics() {
  const uptimeMs = os.uptime() * 1000; // os.uptime() gives seconds
  const host_uptime = formatDuration(uptimeMs);
  const cpuLoad = await si.currentLoad();

  return {
    host_uptime,
    host_cpu_percent: cpuLoad.currentLoad.toFixed(2),
  };
}

// Docker container metrics
async function getContainerMetrics() {
  // List all containers
  const containers = await docker.listContainers({ all: true });
  const results = [];

  // For each container, get details
  for (const c of containers) {
    const container = docker.getContainer(c.Id);
    const inspect = await container.inspect();

    const now = Date.now();
    let uptime;
    let last_seen;

    const state = inspect.State;

    // Calculate uptime and last seen based on running state
    if (state.Running && !state.Paused) {
      // actually running
      uptime = formatDuration(now - new Date(state.StartedAt).getTime());
      last_seen = "Now";
    } else if (state.Paused) {
      // container is paused
      uptime = formatDuration(now - new Date(state.StartedAt).getTime());
      last_seen = "Now (Paused)";
    } else if (state.Status === "exited" || state.Status === "dead") {
      // not running
      uptime = "N/A";
      const lastSeenDate = new Date(state.FinishedAt);
      last_seen = isNaN(lastSeenDate.getTime())
        ? "N/A"
        : formatDuration(now - lastSeenDate.getTime()) + " ago";
    } else if (state.Status === "restarting") {
      // restarting
      uptime = "N/A";
      last_seen = "Now (Restarting)";
    } else {
      // other state (like created)
      uptime = "N/A";
      last_seen = "N/A";
    }

    // CPU & memory stats (live)
    const stats = await container.stats({ stream: false });
    const cpuPercent = calcCPUPercent(stats);
    const memUsage = stats.memory_stats?.usage || 0;
    const memLimit = stats.memory_stats?.limit || 1;
    const memPercent = ((memUsage / memLimit) * 100).toFixed(2);

    results.push({
      name: c.Names[0].replace("/", ""),
      status: inspect.State.Status,
      uptime,
      cpu_percent: cpuPercent,
      mem_percent: memPercent,
      last_seen,
    });
  }

  return results;
}

// Log size (in bytes)
async function getLogSize() {
  try {
    const r = await fetch(`${SERVICE1_URL}/log`);
    const data = await r.text();
    return Buffer.byteLength(data, "utf8");
  } catch {
    return -1;
  }
}

// Minimal login endpoint
app.post("/login", express.json(), (req, res) => {
  const { username, password } = req.body;

  // Validate credentials (just from env variables for simplicity)
  if (
    username !== process.env.PROJECT_USERNAME ||
    password !== process.env.PROJECT_PASSWORD
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  // Return token in JSON
  res.json({ token: `Bearer ${token}` });
});

// Protected metrics endpoint
app.get("/metrics", checkJWT, async (req, res) => {
  try {
    const [host, containers, logSize] = await Promise.all([
      getHostMetrics(),
      getContainerMetrics(),
      getLogSize(),
    ]);
    res.json({ ...host, containers, log_size_bytes: logSize });
  } catch (err) {
    console.error("Error fetching metrics:", err);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Protected logs endpoint
app.get("/log", checkJWT, async (req, res) => {
  try {
    const r = await fetch(`${SERVICE1_URL}/log`);
    const data = await r.text();
    res.type("text/plain").send(data);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).send("Failed to fetch logs");
  }
});

// Reset log via DELETE
app.post("/reset-log", checkJWT, async (req, res) => {
  try {
    const r = await fetch(`${SERVICE1_URL}/log`, { method: "DELETE" });
    if (!r.ok) throw new Error(`Failed with status ${r.status}`);
    res.type("text/plain").send("Log reset successfully");
  } catch (err) {
    console.error("Failed to reset logs:", err);
    res.status(500).send("Failed to reset logs");
  }
});

// Discard old stack (stop & remove old containers)
app.post("/discard-old", checkJWT, async (req, res) => {
  const oldVersion = req.headers["x-discard-version"];
  if (!oldVersion)
    return res
      .status(400)
      .type("text/plain")
      .send("Missing X-Discard-Version header");

  try {
    // List all containers
    const allContainers = await docker.listContainers({ all: true });

    // Filter containers matching the old version
    const containers = allContainers.filter((c) =>
      c.Names.some((name) => name.includes(oldVersion))
    );

    if (containers.length === 0) {
      return res
        .status(404)
        .type("text/plain")
        .send(`No containers found for old stack ${oldVersion}`);
    }

    for (const c of containers) {
      const container = docker.getContainer(c.Id);
      console.log(`Stopping container: ${c.Names[0]}`);
      try {
        await container.stop();
      } catch (err) {
        if (err.statusCode !== 304) {
          // 304 = already stopped
          console.warn(`Failed to stop ${c.Names[0]}: ${err.message}`);
        }
      }

      console.log(`Removing container: ${c.Names[0]}`);
      try {
        await container.remove({ force: true });
      } catch (err) {
        if (err.statusCode !== 404) {
          // ignore if already removed
          console.warn(`Failed to remove ${c.Names[0]}: ${err.message}`);
        }
      }
    }

    res
      .type("text/plain")
      .send(`Old stack ${oldVersion} discarded successfully.`);
  } catch (err) {
    console.error("Error discarding old stack:", err);
    res.status(500).send("Failed to discard old stack");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Monitoring console running on port ${PORT}`);
});
