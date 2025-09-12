from flask import Flask, Response
import psutil
import requests
import datetime

app = Flask(__name__)

# Set the port, URLs and file path
PORT = 5000
SERVICE2_URL = "http://service2:5000/status"
STORAGE_URL = "http://storage:6000/log"
VSTORAGE_FILE = "/app/vstorage.txt"

# Function to get the status record
def get_status_record(service_name: str) -> str:
    # Timestamp in ISO 8601 UTC
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # System uptime (hours)
    uptime_seconds = psutil.boot_time()
    now = datetime.datetime.now(datetime.timezone.utc).timestamp()
    uptime_hours = round((now - uptime_seconds) / 3600, 2)

    # Free disk space in root (MB)
    disk_usage = psutil.disk_usage("/")
    free_mb = round(disk_usage.free / (1024 * 1024))

    return f"{service_name}@{timestamp}: uptime {uptime_hours} hours, free disk in root: {free_mb} MBytes"

# Function to write to vStorage
def write_to_vstorage(record: str):
    # Append the record to the file
    with open(VSTORAGE_FILE, "a") as f:
        f.write(record + "\n")

@app.route("/status", methods=["GET"])
def status():
    # Create status record
    record1 = get_status_record("Service1")

    # Send the record to Storage
    try:
        requests.post(STORAGE_URL, data=record1, headers={"Content-Type": "text/plain"})
    except Exception as e:
        app.logger.error(f"Failed to send record to storage: {e}")

    # Write the record to vStorage
    write_to_vstorage(record1)

    # Forward the request to Service2
    record2 = ""
    try:
        r = requests.get(SERVICE2_URL, timeout=5)
        if r.status_code == 200:
            record2 = r.text.strip()
    except Exception as e:
        app.logger.error(f"Failed to reach Service2: {e}")

    # Combine the records and return
    result = record1 + "\n" + record2 + "\n" if record2 else record1
    return Response(result, mimetype="text/plain")

@app.route("/log", methods=["GET"])
def get_log():
    # Forward the request to Storage to get the log
    try:
        r = requests.get(STORAGE_URL, timeout=5)
        return Response(r.text, mimetype="text/plain")
    except Exception as e:
        app.logger.error(f"Failed to get logs from storage: {e}")
        return Response("Error retrieving logs", status=500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
