package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

// Set the log file path
const logFile = "/data/log.txt"
const port = "6000"

// Function to append a log record to the file
func appendLog(record string) error {
	// Open file in append mode, create if not exists
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	// Write the record and close the file
	defer f.Close()
	_, err = f.WriteString(record + "\n")
	return err
}

// POST /log
func postLog(w http.ResponseWriter, r *http.Request) {
	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}
	// Ensure the body is closed after reading
	defer r.Body.Close()

	record := string(body)
	if record == "" {
		http.Error(w, "empty log", http.StatusBadRequest)
		return
	}

	if err := appendLog(record); err != nil {
		http.Error(w, "failed to append log", http.StatusInternalServerError)
		return
	}
	// Respond with success
	w.WriteHeader(http.StatusOK)
}

// GET /log
func getLog(w http.ResponseWriter, r *http.Request) {
	// Read the entire log file
	data, err := os.ReadFile(logFile)
	if err != nil {
		// If file doesn’t exist yet, return empty
		if os.IsNotExist(err) {
			w.Header().Set("Content-Type", "text/plain")
			w.Write([]byte(""))
			return
		}
		http.Error(w, "failed to read log", http.StatusInternalServerError)
		return
	}

	// Return the log content
	w.Header().Set("Content-Type", "text/plain")
	w.Write(data)
}

// Main function to start the HTTP server
func main() {
	// Define HTTP handlers
	http.HandleFunc("/log", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			// Handle POST requests
			postLog(w, r)
		} else if r.Method == http.MethodGet {
			// Handle GET requests
			getLog(w, r)
		} else {
			// Respond with 405 Method Not Allowed for other methods
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Start the HTTP server on the specified port
	fmt.Println("Storage service running on port", port)
	http.ListenAndServe(":"+port, nil)
}
