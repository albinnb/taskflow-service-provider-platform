# Stage 1: Build Stage (Not strictly necessary for simple Node app, but good practice)
FROM node:20-alpine as build

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Stage 2: Production Stage
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules

# Copy application source code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run the application
CMD [ "npm", "start" ]