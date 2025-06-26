# Docker Setup for mongoose-ai

## Quick Start

### 1. Setup Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. Build and Run

```bash
# Build the Docker image (first time or when dependencies change)
docker compose build

# Run examples
docker compose run --rm mongoose-ai npm run example:basic
docker compose run --rm mongoose-ai npm run example:benchmark
docker compose run --rm mongoose-ai npm run example:advanced
docker compose run --rm mongoose-ai npm run example:scaling
```

### 3. Development Workflow

```bash
# Start MongoDB for local development
docker compose up mongodb -d

# Stop everything
docker compose down
```

## Available Commands

### Docker Commands

```bash
# Build the development environment
docker compose build

# Run any npm script
docker compose run --rm mongoose-ai npm run <script-name>

# Run tests
docker compose run --rm mongoose-ai npm test

# Run custom TypeScript files
docker compose run --rm mongoose-ai npx tsx examples/your-file.ts

# Start MongoDB only
docker compose up mongodb -d

# Clean up everything
docker compose down -v
```

### NPM Scripts (Updated)

```bash
# Development
npm run build                 # Build the project
npm run dev                   # Watch mode development
npm run test                  # Run tests
npm run lint                  # Check code quality

# Examples (run locally)
npm run example:basic         # Basic usage example
npm run example:advanced      # Advanced usage patterns
npm run example:benchmark     # Performance benchmarking
npm run example:scaling       # Database scaling tests

# Docker shortcuts (if you add them to package.json)
npm run docker:build          # Build Docker image
npm run docker:benchmark      # Run benchmark in Docker
npm run docker:up             # Start all services
npm run docker:down           # Stop all services
```

## What's Included

- **MongoDB 7.0** - Database with health checks on port 27017
- **Node.js 18 Alpine** - Lightweight runtime environment
- **All Dependencies** - Pre-installed npm packages including dev dependencies
- **Built Project** - TypeScript compiled and ready to run
- **Examples** - All examples ready to execute
- **Health Checks** - MongoDB health monitoring

## Files Structure

```
mongoose-ai/
├── Dockerfile              ← Build configuration
├── docker-compose.yaml     ← Services configuration
├── .dockerignore           ← Docker build exclusions
├── .env                    ← Your API keys (create this)
├── examples/
│   ├── basic-usage.ts      ← Getting started
│   ├── usage.ts            ← Advanced patterns
│   ├── benchmark-demo.ts   ← Performance testing
│   └── scaling-test.ts     ← Database scaling
└── package.json            ← Dependencies and scripts
```

## One-Line Setup

```bash
# 1. Set your API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 2. Build and run
docker compose build && docker compose run --rm mongoose-ai npm run example:basic
```

## Development Tips

### First Time Setup

```bash
# Complete setup
git clone <repository>
cd mongoose-ai
echo "OPENAI_API_KEY=sk-your-key-here" > .env
docker compose build
```

### Daily Development

```bash
# Start MongoDB for local development
docker compose up mongodb -d

# Run your code locally (faster)
npm install
npm run example:basic

# Or run in Docker (consistent environment)
docker compose run --rm mongoose-ai npm run example:basic
```

### Updating Dependencies

```bash
# Rebuild when package.json changes
docker compose build --no-cache

# Force rebuild everything
docker compose down -v
docker compose build --no-cache
```

### Performance Testing

```bash
# Run all performance tests
docker compose run --rm mongoose-ai npm run example:benchmark
docker compose run --rm mongoose-ai npm run example:scaling

# Run with different database sizes
docker compose run --rm mongoose-ai npx tsx examples/scaling-test.ts
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**

```bash
# Wait for MongoDB to be ready
docker compose up mongodb -d
sleep 10
docker compose run --rm mongoose-ai npm run example:basic
```

**Image Build Failed**

```bash
# Clean build
docker compose down -v
docker system prune -f
docker compose build --no-cache
```

**Permission Issues**

```bash
# Fix ownership (Linux/macOS)
sudo chown -R $USER:$USER .
```

**Environment Variables**

```bash
# Check if .env is loaded
docker compose run --rm mongoose-ai env | grep OPENAI
```

### Logs and Debugging

```bash
# View MongoDB logs
docker compose logs mongodb

# Run with debug output
docker compose run --rm mongoose-ai npm run example:basic --verbose

# Enter container for debugging
docker compose run --rm mongoose-ai sh
```

## Production Notes

This Docker setup is optimized for **development and testing**. For production:

- Use multi-stage builds to reduce image size
- Run as non-root user
- Use production MongoDB setup
- Implement proper secrets management
- Add monitoring and logging

That's it! The setup is now robust and easy to use.
