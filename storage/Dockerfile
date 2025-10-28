# Multi-stage build
FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY storage.go go.mod go.sum ./

# Ensure dependencies are downloaded
RUN go mod tidy
RUN go build -o storage storage.go

FROM alpine:3.22
WORKDIR /app

COPY --from=builder /app/storage .

# Run the application
CMD ["./storage"]
