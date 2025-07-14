FROM node:18-alpine

WORKDIR /app

# Set environment variables for Next.js public runtime configuration
# These values will be inlined into the client-side bundle during the build.
ENV NEXT_PUBLIC_DATA_API_URL="https://clinic-backend.nikflow.ir"
ENV NEXT_PUBLIC_AI_API_URL="http://clinicaiagent.nikflow.ir"

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
