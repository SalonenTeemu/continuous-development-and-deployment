package main

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"

	_ "github.com/lib/pq"
)

// Set the port and database connection string
const (
	port    = "6000"
	connStr = "postgres://user:pass@postgres:5432/logs?sslmode=disable"
)

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
		record TEXT NOT NULL
	)`)
	return err
}

// Function to append a log record to the database
func appendLog(record string) error {
	_, err := db.Exec("INSERT INTO logs (record) VALUES ($1)", record)
	return err
}

// Function to retrieve all log records from the database
func getAllLogs() (string, error) {
	// Query all records ordered by ID
	rows, err := db.Query("SELECT record FROM logs ORDER BY id ASC")
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var result string
	// Iterate through the rows and concatenate records
	for rows.Next() {
		var record string
		if err := rows.Scan(&record); err != nil {
			return "", err
		}
		result += record + "\n"
	}
	return result, nil
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
	// Retrieve all logs from the database
	data, err := getAllLogs()
	if err != nil {
		http.Error(w, "failed to read logs", http.StatusInternalServerError)
		return
	}
	// Respond with the log content
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(data))
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
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Start the HTTP server on the specified port
	fmt.Println("Storage service running on port", port)
	http.ListenAndServe(":"+port, nil)
}
