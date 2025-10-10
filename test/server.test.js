const supertest = require("supertest");
const fs = require("fs");

const serverUrl = "http://localhost:8199";
const request = supertest(serverUrl);

(async () => {
  let report = "";

  // Test that POST request returns correct average
  try {
    const postResponse = await request
      .post("/")
      .send({ numbers: [1, 5, 5, 8] })
      .set("Accept", "text/plain")
      .set("Content-Type", "application/json");

    const result = parseInt(postResponse.text);
    const expected = 4;
    report += `POST test result: ${result}, Expected: ${expected}\n`;

    if (result !== expected) {
      report += "POST test FAILED!\n";
      fs.writeFileSync("test-report.txt", report);
      console.error(report);
      process.exit(1);
    } else {
      report += "POST test PASSED\n";
    }
  } catch (err) {
    report += "POST test ERROR: " + err.message + "\n";
    fs.writeFileSync("test-report.txt", report);
    console.error(report);
    process.exit(1);
  }

  // Test that GET request returns 405 Method Not Allowed
  try {
    const getResponse = await request.get("/");
    report += `GET request status code: ${getResponse.status}, Expected: 405\n`;

    if (getResponse.status !== 405) {
      report += "GET test FAILED! Expected 405\n";
      fs.writeFileSync("test-report.txt", report);
      console.error(report);
      process.exit(1);
    } else {
      report += "GET test PASSED\n";
    }
  } catch (err) {
    report += "GET test ERROR: " + err.message + "\n";
    fs.writeFileSync("test-report.txt", report);
    console.error(report);
    process.exit(1);
  }

  // Test that health check endpoint returns 200 OK
  try {
    const healthResponse = await request.get("/health");
    report += `Health check status code: ${healthResponse.status}, Expected: 200\n`;

    if (healthResponse.status !== 200) {
      report += "Health check test FAILED! Expected 200\n";
      fs.writeFileSync("test-report.txt", report);
      console.error(report);
      process.exit(1);
    } else {
      report += "Health check test PASSED\n";
    }
  } catch (err) {
    report += "Health check test ERROR: " + err.message + "\n";
    fs.writeFileSync("test-report.txt", report);
    console.error(report);
    process.exit(1);
  }

  // Write final report
  fs.writeFileSync("test-report.txt", report);
  console.log(report);
  process.exit(0);
})();
