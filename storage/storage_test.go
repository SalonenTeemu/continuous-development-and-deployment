package main

import (
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

// Helper to create a mock database
func mockDB(t *testing.T) sqlmock.Sqlmock {
	var mock sqlmock.Sqlmock
	var err error

	db, mock, err = sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	return mock
}

// Test appendLog()
func TestAppendLog(t *testing.T) {
	mock := mockDB(t)

	entry := LogEntry{
		Service:       "Service1",
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
		UptimeSeconds: 3600,
		FreeMB:        500000,
	}

	mock.ExpectExec("INSERT INTO logs").
		WithArgs(entry.Service, entry.Timestamp, entry.UptimeSeconds, entry.FreeMB).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := appendLog(entry)
	if err != nil {
		t.Fatalf("appendLog failed: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %v", err)
	}
}

// Test getAllLogs()
func TestGetAllLogs(t *testing.T) {
	mock := mockDB(t)

	rows := sqlmock.NewRows([]string{"service", "timestamp", "uptime_seconds", "free_mb"}).
		AddRow("Service1", "2025-11-24T18:01:54Z", 3600, 500000).
		AddRow("Service2", "2025-11-24T18:05:00Z", 7200, 400000)

	mock.ExpectQuery("SELECT service, timestamp, uptime_seconds, free_mb FROM logs").
		WillReturnRows(rows)

	entries, err := getAllLogs()
	if err != nil {
		t.Fatalf("getAllLogs failed: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	if entries[0].Service != "Service1" || entries[1].Service != "Service2" {
		t.Fatalf("unexpected service names: %+v", entries)
	}

	if entries[0].FreeMB != 500000 || entries[1].FreeMB != 400000 {
		t.Fatalf("unexpected free MB values: %+v", entries)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %v", err)
	}
}
