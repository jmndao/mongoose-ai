# Docker Setup for mongoose-ai

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. Run Examples
```bash
# Run benchmark demo
docker-compose run --rm mongoose-ai npm run example:benchmark

# Run basic usage example  
docker-compose run --rm mongoose-ai npm run example:basic

# Run advanced usage example
docker-compose run --rm mongoose-ai npm run example:advanced
```

### 3. Start Everything
```bash
# Start MongoDB and run benchmark
docker-compose up --build

# Stop everything
docker-compose down
```

## 📊 Available Commands

```bash
# Quick benchmark run
npm run docker:benchmark

# Basic example
npm run docker:basic  

# Advanced example
npm run docker:advanced

# Start all services
npm run docker:up

# Stop all services  
npm run docker:down
```

## 🔧 What's Included

- **MongoDB 7.0** - Database running on port 27017
- **Node.js 18** - Runtime environment with all dependencies
- **Auto-setup** - Automatically installs npm packages
- **Examples** - All examples ready to run

## 📁 Files Structure

```
mongoose-ai/
├── docker-compose.yml     ← Main Docker configuration
├── .env                   ← Your API keys (create this)
├── examples/
│   ├── benchmark-demo.ts  ← Benchmark demonstration
│   ├── basic-usage.ts     ← Basic example
│   └── advanced-usage.ts  ← Advanced example
└── package.json           ← Updated with Docker scripts
```

## ⚡ One-Line Setup

```bash
# 1. Set your API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# 2. Run benchmark
docker-compose run --rm mongoose-ai npm run example:benchmark
```

That's it! 🎉