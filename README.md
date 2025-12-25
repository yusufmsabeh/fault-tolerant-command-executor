# Fault-Tolerant Command Executor

A distributed system for executing commands with fault tolerance and recovery capabilities.

## Architecture

This project consists of two main services:

- **Control Service** (`control-service/`): Manages command queue, assigns work to agents, and handles recovery
- **Agent Service** (`agent/`): Polls for commands, executes them, and reports results

## Project Structure

```
fault-tolerant-command-executor/
├── control-service/          # Command Service (formerly at root)
│   ├── src/
│   │   ├── controllers/      # HTTP controllers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── agent/                    # Agent Service
│   ├── src/
│   │   ├── controllers/      # HTTP controllers
│   │   ├── services/         # Business logic
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Getting Started

### Control Service

```bash
cd control-service
npm install
npm run dev
```

### Agent Service

```bash
cd agent
npm install
npm run dev
```