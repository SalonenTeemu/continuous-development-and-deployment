# Use multi-stage build to create a small final image
FROM golang:1.25-alpine AS builder

# Set working directory and copy source code
WORKDIR /app
COPY storage.go .

# Build static binary
RUN go build -o storage storage.go

# Final stage: use alpine image to run the binary
FROM alpine:3.22
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/storage .

# Create persistent data folder
RUN mkdir -p /data

# Define volume for persistent storage
VOLUME ["/data"]

# Expose port and run the application
EXPOSE 6000
CMD ["./storage"]
