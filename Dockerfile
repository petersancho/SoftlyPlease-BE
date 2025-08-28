# Heroku Web App Dockerfile - Modern & Production Ready
# Build with: heroku container:push web
# Release with: heroku container:release web

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for your app)
RUN apk add --no-cache git

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies for production
RUN npm ci --omit=dev --no-audit --no-fund

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port (Heroku will override this with $PORT)
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/status', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "app.js"]
