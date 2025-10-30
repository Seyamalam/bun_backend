# Use official Bun image (minimal, no full OS)
FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=/data/ecommerce.db \
    JWT_SECRET=change-this-in-production \
    JWT_EXPIRY=24h \
    ENABLE_RATE_LIMIT=true

# Create data directory for SQLite database
RUN mkdir -p /data

# Run the application
CMD ["bun", "index.ts"]
