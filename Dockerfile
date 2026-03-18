# ─────────────────────────────────────
# AzureLens Backend — Dockerfile
# ─────────────────────────────────────

FROM node:18-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/ || exit 1

# Start the server
CMD ["node", "index.js"]
