FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json yarn.lock* ./

# Install dependencies without running prepare script
RUN npm install --ignore-scripts

# Copy source code
COPY . .

# Now build the project
RUN npm run build

# Default command (can be overridden)
CMD ["npm", "run", "example:basic"]