from flask import Flask, Response
import psutil
import requests
import datetime

app = Flask(__name__)

# Set the port and service URLs
PORT = 5000
SERVICE2_URL = "http://service2_v1_0:5001/status"
STORAGE_URL = "http://storage:6000/log"

# Function to get the status record and JSON entry for Storage
def create_status_record():
    # Timestamp in ISO 8601 UTC
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # System uptime in seconds
    uptime_seconds = int(datetime.datetime.now(datetime.timezone.utc).timestamp() - psutil.boot_time())

    # Free disk space in MB
    free_mb = round(psutil.disk_usage("/").free / (1024 * 1024))

    # JSON entry for Storage
    entry = {
        "service": "Service1",
        "timestamp": timestamp,
        "uptime_seconds": uptime_seconds,
        "free_mb": free_mb
    }

    # Text string for caller
    uptime_hours = round(uptime_seconds / 3600, 2)
    text_string = f"Service1@{timestamp}: uptime {uptime_hours} hours, free disk in root: {free_mb} MBytes"

    return entry, text_string

@app.route("/status", methods=["GET"])
def status():
    # Create Service1 status
    entry1, record1 = create_status_record()

    # Send JSON entry to Storage
    try:
        requests.post(STORAGE_URL, json=entry1, timeout=5)
    except Exception as e:
        app.logger.error(f"Failed to send record to storage: {e}")

    # Forward the request to Service2
    record2 = ""
    try:
        r = requests.get(SERVICE2_URL, timeout=5)
        if r.status_code == 200:
            record2 = r.text.strip()
    except Exception as e:
        app.logger.error(f"Failed to reach Service2: {e}")

    # Combine the records and return
    result = record1 + "\n" + record2 if record2 else record1
    return Response(result, mimetype="text/plain")
    
@app.route("/log", methods=["GET"])
def get_log():
    try:
        # Fetch JSON logs from Storage
        r = requests.get(STORAGE_URL, timeout=5)
        r.raise_for_status()
        logs = r.json() # Expecting a list of log entries
        
        # Check logs is iterable, if not -> set to empty list
        if not isinstance(logs, list):
            logs = []

        # Convert each entry into text string (uptime in hours)
        lines = []
        for entry in logs:
            uptime_hours = round(entry.get("uptime_seconds", 0) / 3600, 2)
            free_mb = entry.get("free_mb", 0)
            timestamp = entry.get("timestamp", "")
            service = entry.get("service", "Unknown")
            lines.append(f"{service}@{timestamp}: uptime {uptime_hours} hours, free disk in root: {free_mb} MBytes")
            
        # Check if there are no logs, return empty response
        if not lines:
            return Response("", mimetype="text/plain")

        # Join all lines and return
        return Response("\n".join(lines), mimetype="text/plain")

    except Exception as e:
        app.logger.error(f"Failed to get logs from storage: {e}")
        return Response("Error retrieving logs", status=500)
    
@app.route("/log", methods=["DELETE"])
def delete_log():
    # Forward the delete request to Storage to clear the log
    try:
        r = requests.delete(STORAGE_URL, timeout=5)
        if r.status_code == 200:
            return Response("Logs cleared", status=200)
        else:
            return Response("Failed to clear logs", status=r.status_code)
    except Exception as e:
        app.logger.error(f"Failed to delete logs from storage: {e}")
        return Response("Error clearing logs", status=500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
