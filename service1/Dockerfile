# Use slim Python 3.13 image as base
FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app.py .

# Create vstorage mount point
RUN mkdir -p /app/vstorage

# Run the application
CMD ["python", "app.py"]
