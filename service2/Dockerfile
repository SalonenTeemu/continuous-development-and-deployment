# Use slim Node.js 24 image as base
FROM node:24-slim

WORKDIR /app

# Install dependencies
COPY package.json .
RUN npm install

# Copy app code
COPY index.js .

# Create vstorage mount point
RUN mkdir -p /app/vstorage

# Run the application
CMD ["node", "index.js"]
