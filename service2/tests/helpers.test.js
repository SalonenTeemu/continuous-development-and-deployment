import test from "node:test";
import assert from "node:assert";
import { createStatusRecord } from "../helpers.js";

test("getStatusRecord returns properly formatted string", async () => {
  // Mock systeminformation
  const fakeSI = {
    time: () => Promise.resolve({ uptime: 7200 }), // 2 hours
    fsSize: () =>
      Promise.resolve([
        { size: 1000 * 1024 * 1024, used: 200 * 1024 * 1024 }, // 800MB free
      ]),
  };

  const result = await createStatusRecord(fakeSI);

  assert.match(result.textString, /^Service2@/);
  assert.match(result.textString, /uptime 2\.00 hours/);
  assert.match(result.textString, /free disk in root: 800 MBytes/);
});
