# ============================================
# Anka MFO Backend - Optimized Dockerfile
# ============================================

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies (generates lockfile if missing)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============================================
# Development stage (OPTIMIZED)
# ============================================
FROM node:24-alpine AS development

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user and app directory with correct ownership
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
    && mkdir -p /app && chown -R nodejs:nodejs /app

WORKDIR /app

# Switch to nodejs user
USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY --chown=nodejs:nodejs . .

EXPOSE 3333

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# ============================================
# Production stage (OPTIMIZED)
# ============================================
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user and app directory with correct ownership
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
    && mkdir -p /app && chown -R nodejs:nodejs /app

WORKDIR /app

# Switch to nodejs user
USER nodejs

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3333/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
