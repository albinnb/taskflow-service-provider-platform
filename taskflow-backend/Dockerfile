# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install ALL dependencies (including devDependencies if needed for build steps)
# Using legacy-peer-deps to avoid the cloudinary/ioredis conflicts
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Stage 2: Production Runtime
FROM node:20-alpine

# Set Node environment to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package.json to install only production dependencies
COPY package*.json ./

# Install only production dependencies for smaller image size
RUN npm ci --only=production --legacy-peer-deps

# Copy the built code from the builder stage
COPY --from=builder /app/src ./src

# Create uploads directory (if local storage is used for profile pics/services)
RUN mkdir -p uploads && chown -R node:node uploads

# Switch to non-root 'node' user for security
USER node

# Expose API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]