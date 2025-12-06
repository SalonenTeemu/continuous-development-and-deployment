import express from "express";
import fetch from "node-fetch";
import { createStatusRecord } from "./helpers.js";

// Initialize Express app and use text middleware
const app = express();
app.use(express.text());

// Set the port and storage URL
const PORT = 5001;
const STORAGE_URL = "http://storage:6000/log";

// GET /status
app.get("/status", async (req, res) => {
  try {
    // Create status record
    const { entry, textString } = await createStatusRecord();

    // Send JSON entry to Storage
    await fetch(STORAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch((err) => console.error("Failed to send to storage:", err.message));

    // Return plain text to Service1
    res.type("text/plain").send(textString);
  } catch (err) {
    console.error("Error generating status:", err);
    res.status(500).send("Error generating status");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Service2 running on port ${PORT}`);
});
