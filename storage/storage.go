package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

var (
	port    = "6000"
	dbUser  = getEnv("POSTGRES_USER", "user")
	dbPass  = getEnv("POSTGRES_PASSWORD", "pass")
	dbHost  = getEnv("POSTGRES_HOST", "postgres")
	dbPort  = getEnv("POSTGRES_PORT", "5432")
	dbName  = getEnv("POSTGRES_DB", "logs")
	connStr = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", dbUser, dbPass, dbHost, dbPort, dbName)
)

// Helper to read env with default fallback
func getEnv(key, defaultVal string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultVal
	}
	return val
}

var db *sql.DB

// Function to initialize the database
func initDB() error {
	var err error
	// Connect to PostgreSQL
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}
	// Create table if it doesn't exist
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    uptime_seconds BIGINT NOT NULL,
    free_mb INT NOT NULL
	)`)
	return err
}

// LogEntry presents a log record
type LogEntry struct {
	Service       string `json:"service"`
	Timestamp     string `json:"timestamp"`
	UptimeSeconds int    `json:"uptime_seconds"`
	FreeMB        int    `json:"free_mb"`
}

// Function to append a log entry to the database
func appendLog(entry LogEntry) error {
	_, err := db.Exec(`
        INSERT INTO logs (service, timestamp, uptime_seconds, free_mb)
        VALUES ($1, $2, $3, $4)
    `, entry.Service, entry.Timestamp, entry.UptimeSeconds, entry.FreeMB)
	return err
}

// Function to retrieve all log records from the database
func getAllLogs() ([]LogEntry, error) {
	// Query all records ordered by ID
	rows, err := db.Query(`
        SELECT service, timestamp, uptime_seconds, free_mb
        FROM logs ORDER BY id ASC
    `)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []LogEntry

	// Iterate through the rows and scan into LogEntry structs
	for rows.Next() {
		var e LogEntry
		if err := rows.Scan(&e.Service, &e.Timestamp, &e.UptimeSeconds, &e.FreeMB); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}

	// Return the slice of log entries
	return entries, nil
}

// POST /log
func postLog(w http.ResponseWriter, r *http.Request) {
	// Read the request body
	body, _ := io.ReadAll(r.Body)
	// Ensure the body is closed after reading
	defer r.Body.Close()

	var entry LogEntry
	// Parse JSON body into LogEntry struct
	if err := json.Unmarshal(body, &entry); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	// Append the log entry to the database and handle errors
	if err := appendLog(entry); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
}

// GET /log
func getLog(w http.ResponseWriter, _ *http.Request) {
	// Retrieve all logs from the database
	entries, err := getAllLogs()
	if err != nil {
		http.Error(w, "failed to read logs", http.StatusInternalServerError)
		return
	}

	// Respond with the log entries as JSON
	w.Header().Set("Content-Type", "application/json")

	// Encode entries to JSON and write to response
	json.NewEncoder(w).Encode(entries)
}

// DELETE /log
func deleteLog(w http.ResponseWriter, _ *http.Request) {
	// Clear all logs from the logs table
	_, err := db.Exec("TRUNCATE TABLE logs")
	if err != nil {
		http.Error(w, "failed to clear logs", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("logs cleared"))
}

// Main function to initialize the database and start the HTTP server
func main() {
	// Initialize the database
	if err := initDB(); err != nil {
		fmt.Println("Failed to init DB:", err)
		os.Exit(1)
	}

	// Define HTTP handlers
	http.HandleFunc("/log", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			postLog(w, r)
		case http.MethodGet:
			getLog(w, r)
		case http.MethodDelete:
			deleteLog(w, r)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Start the HTTP server on the specified port
	fmt.Println("Storage service running on port", port)
	http.ListenAndServe(":"+port, nil)
}
