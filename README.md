# Fault-Tolerant Single-Agent Command Execution System

## 1. Project Overview

This project is a **fault-tolerant command execution system** with an ​**agent-server architecture**​.

* **Purpose:** Demonstrate **idempotency** and **crash recovery** in a distributed system.
* **Audience:** Skipr evaluation team.
* **Highlights:** The system ensures that commands are never executed twice unintentionally, and it can recover gracefully from both server and agent crashes.

---

## 2. Architecture

The system consists of two services:

1. **Control Server**
   * Accepts commands, maintains their lifecycle, and persists state in a database.
   * Exposes HTTP endpoints for creating commands, fetching status, and assigning commands to agents.
2. **Agent**
   * Polls the Control Server using short polling (`/api/commands/next`) to fetch the next command.
   * Executes commands according to their type and reports results back to the server.

### Command Lifecycle

```
PENDING → RUNNING → COMPLETED / FAILED
```

### Idempotency & Recovery

* When a command is created, the user marks it as **safe to retry** using the `isIdempotent` flag.
* **Server restart recovery:**
  * The server fetches all `RUNNING` commands.
  * For each command:
    * Checks the agent logs.
    * If logs exist → update status to `COMPLETED` or `FAILED` accordingly.
    * If logs don’t exist:
      * If the agent is still processing → keep it `RUNNING`.
      * Otherwise → check `isIdempotent`:
        * `true` → set status back to `PENDING`
        * `false` → set status to `FAILED` for manual review
* **Agent restart recovery:**
  * Agent requests the next command from the server.
  * Server performs the same recovery logic for commands assigned to that agent.

---

## 3. Persistence

* **Database:** SQLite
* **ORM:** Sequelize
* **Reason:** Lightweight, deterministic, and easy to set up for local development.
* All columns in the database are ​**snake\_case**​, while the application logic uses ​**camelCase**​.
* Migrations are managed using `sequelize-cli` rather than `sequelize.sync()`.

---

## 4. Commands

Two types of commands are supported:

1. **DELAY**
   * Payload:

```json
{
  "type": "DELAY",
  "payload": { "ms": 2000 },
  "isIdempotent": true
}
```

2. **HTTP\_GET\_JSON**
   * Payload:

```json
{
  "type": "HTTP_GET_JSON",
  "payload": { "url": "https://api.example.com/data" },
  "isIdempotent": false
}
```

* **`isIdempotent` flag:**
  * Indicates whether the command can be safely retried if no logs are found during recovery.
  * Used inside the **recovery logic** to make deterministic decisions.

---

## 5. Agent Behavior

* Polls the server via `GET /api/commands/next`.
* Executes commands according to type (`DELAY` or `HTTP_GET_JSON`).
* Reports results via `PATCH /api/commands/:id`.
* **Failure simulation flags:**
  * `--kill-after=N` → crash after N seconds
  * `--random-failures` → fail with a fixed probability (default 30%, configurable via `.env`)
* **Recovery responsibility:** Handled by the server according to logs and `isIdempotent` flag.

---

## 6. Running the Project

####Control-service

1. 

```bash
cd control-service
```

2. Copy `.env.example` to `.env` and configure variables.
3. Install dependencies:

```bash
npm install
```

3. Run database migrations:

```bash
npm run migrate
```

4. Start the server:

```bash
npm run dev
```

####agent:

1. 

```bash
cd agent
```

3. Install dependencies:

```bash
npm install
```

3. Run database migrations:

```bash
npm run migrate
```

4. Start the server:

```bash
npm run dev
```



6. Example workflow:
   * Create command: `POST /api/commands`
   * Agent picks up the command and executes it
   * Check status: `GET /api/commands/:id`

---

## 7. Docker

* Both the Control Server and Agent can run using Docker.
* Steps:
  1. Copy `.env.example` to `.env` and update values.
  2. Run:

```bash
docker-compose up
```

* Services included: Agent, Control Server

---

## 8. Trade-offs & Decisions

* **Agent logs commands:** Enables the server to distinguish successfully executed commands from failed ones during recovery.
* **`isIdempotent` column:** Determines whether the server can safely re-run a command if logs are missing.
* **Server assigns state responsibility:** This centralizes recovery logic and avoids duplicate execution.


