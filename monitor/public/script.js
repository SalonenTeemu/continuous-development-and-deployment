// Check if already logged in
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }
});

// Login form
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Send login request
  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("jwtToken", data.token);
      showDashboard();
      document.getElementById("login-error").style.display = "none";
      alert(
        "Login successful! Copy the token for API access. Stored in localStorage, valid 1 hour.\n\n" +
          data.token
      );
    } else {
      showLoginError();
    }
  } catch (err) {
    console.error(err);
    showLoginError();
  }
});

// Show dashboard section
function showDashboard() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("dashboard-section").style.display = "block";
  refreshAll();
  setInterval(refreshAll, 5000);
}

// Show login section
function showLogin() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("dashboard-section").style.display = "none";
}

// Show login error
function showLoginError() {
  const errorEl = document.getElementById("login-error");
  errorEl.style.display = "block";
}

// Logout
function logout() {
  localStorage.removeItem("jwtToken");
  showLogin();
}

// Function to fetch and display metrics and logs
async function refreshAll() {
  const token = localStorage.getItem("jwtToken");
  const headers = token ? { Authorization: token } : {};

  try {
    const res = await fetch("/metrics", { headers });
    const data = await res.json();
    let html = `
      <h2>Host</h2>
      <p>Uptime: ${data.host_uptime} | CPU: ${data.host_cpu_percent}%</p>
      <h2>Containers</h2>
      <table>
        <tr>
          <th>Name</th><th>Status</th><th>Uptime</th><th>CPU (%)</th><th>Mem (%)</th><th>Last Seen</th>
        </tr>
        ${data.containers
          .map(
            (c) =>
              `<tr>
                <td>${c.name}</td>
                <td>${c.status}</td>
                <td>${c.uptime}</td>
                <td>${c.cpu_percent}</td>
                <td>${c.mem_percent}</td>
                <td>${c.last_seen}</td>
              </tr>`
          )
          .join("")}
      </table>
      <h2>Log Size</h2>
      <p>${data.log_size_bytes} bytes</p>
    `;
    document.getElementById("metrics").innerHTML = html;

    const logRes = await fetch("/log", { headers });
    const logText = await logRes.text();
    if (logText == "") {
      document.getElementById("log").textContent = "No logs found.";
    } else {
      document.getElementById("log").textContent = logText;
    }
  } catch (err) {
    console.error("Failed to fetch metrics/logs:", err);
  }
}

// Helper to POST to an endpoint with JWT
async function postWithToken(endpoint, message) {
  const token = localStorage.getItem("jwtToken");
  if (!token) return alert("Not logged in!");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error(`Failed with status: ${res.status} and message: ${await res.text()}`);
    alert(message || "Operation successful");
    refreshAll();
  } catch (err) {
    console.error(err);
    alert(`Error with the operation: ${err.message}`);
  }
}

// Attach handlers to buttons
document
  .querySelector("form[action='/reset-log']")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    postWithToken("/reset-log", "Logs reset successfully!");
    document.getElementById("log").textContent = "";
  });

document
  .querySelector("form[action='/switch-version']")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    postWithToken("/switch-version", "Version switched successfully!");
  });

document
  .querySelector("form[action='/discard-old']")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    postWithToken("/discard-old", "Old version discarded successfully!");
  });
