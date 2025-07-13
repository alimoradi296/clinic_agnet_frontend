FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Debug: List contents of project root and lib directory
RUN ls -la .
RUN ls -la lib || echo "lib directory does not exist"

# Debug: List contents of components/ui
RUN ls -la components/ui

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]