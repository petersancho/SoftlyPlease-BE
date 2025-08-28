<<<<<<< HEAD
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 80
ENV PORT=80

CMD [ "npm", "start" ]
=======
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
>>>>>>> c41033c05d4751a82a5fe6faa753e5cfe35f0d1d
