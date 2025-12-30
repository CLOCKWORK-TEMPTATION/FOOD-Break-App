# ================================
# Backend Dockerfile - BreakApp
# Multi-stage build for production
# ================================

# ----------------
# Development Stage
# ----------------
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]

# ----------------
# Build Stage
# ----------------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript (if using TS)
RUN npm run build || echo "No build script found, skipping..."

# Remove dev dependencies
RUN npm prune --production

# ----------------
# Production Stage
# ----------------
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Copy built node_modules from build stage
COPY --chown=nodejs:nodejs --from=build /app/node_modules ./node_modules

# Copy Prisma files
COPY --chown=nodejs:nodejs --from=build /app/prisma ./prisma

# Copy built application or source
COPY --chown=nodejs:nodejs --from=build /app/dist ./dist 2>/dev/null || \
     COPY --chown=nodejs:nodejs --from=build /app/src ./src

# Copy other necessary files
COPY --chown=nodejs:nodejs --from=build /app/*.js ./
COPY --chown=nodejs:nodejs --from=build /app/*.json ./

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD ["npm", "start"]
