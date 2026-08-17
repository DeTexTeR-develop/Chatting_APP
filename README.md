# Real-Time Chat Application

A scalable real-time chat application built with **Node.js, Express, TypeScript, PostgreSQL, Redis, Socket.IO, and Angular**.

The project started as a full-stack real-time chat application and has evolved into a backend-focused project for learning and implementing production-oriented concepts such as authentication, WebSockets, Redis caching, presence tracking, Pub/Sub, cursor-based pagination, database indexing, and horizontal scaling.

The current implementation focuses on completing the core backend architecture and preparing the application for production deployment.

---

## Overview

The application allows authenticated users to communicate through real-time conversations.

The backend exposes REST APIs for persistent operations and uses Socket.IO for real-time communication. PostgreSQL acts as the source of truth for persistent application data, while Redis is used for low-latency and distributed use cases such as caching, presence, and Pub/Sub.

The frontend has been migrated from React to Angular.

### Main technologies

| Layer | Technology |
|---|---|
| Frontend | Angular |
| Backend | Node.js + Express.js |
| Language | TypeScript |
| Database | PostgreSQL |
| Cache / Distributed state | Redis |
| Real-time communication | Socket.IO |
| Authentication | JWT |
| Authentication storage | HTTP-only cookies |
| Containerization | Docker |
| Version control | Git |

---

# Architecture

The application follows a separation between the HTTP API, real-time communication layer, persistent storage, and Redis-based infrastructure.

```text
                         ┌──────────────────────┐
                         │    Angular Client    │
                         └──────────┬───────────┘
                                    │
                       HTTP Requests │ WebSocket
                                    │
                                    ▼
                    ┌────────────────────────────┐
                    │       Node.js Server       │
                    │                            │
                    │  Express     Socket.IO     │
                    │     │           │           │
                    │     └─────┬─────┘           │
                    │           │                 │
                    │      Services              │
                    └───────┬───────┬────────────┘
                            │       │
                  ┌─────────┘       └──────────┐
                  ▼                            ▼
          ┌───────────────┐             ┌───────────────┐
          │  PostgreSQL   │             │     Redis     │
          │               │             │               │
          │ Users         │             │ Cache         │
          │ Conversations │             │ Presence      │
          │ Messages      │             │ Pub/Sub       │
          └───────────────┘             └───────────────┘
```

---

# Core Features

## Authentication

The application uses JWT-based authentication.

The authentication flow is approximately:

```text
Client
  │
  │ Login / Signup
  ▼
Express API
  │
  │ Validate credentials
  ▼
JWT generated
  │
  ▼
HTTP-only Cookie
  │
  ▼
Authenticated requests
```

JWT authentication is also applied to Socket.IO connections.

The socket connection sends the authentication cookie during the handshake, and the server validates the token before allowing the connection.

This prevents unauthenticated clients from establishing authenticated socket sessions.

---

# User Management

The backend provides user-related functionality through REST APIs.

User information can be retrieved and updated through the API, with authentication middleware protecting operations that require an authenticated user.

Redis caching is used for frequently accessed user data.

The cache follows a **cache-aside** strategy.

```text
                 Request
                    │
                    ▼
              Check Redis
               /                   HIT         MISS
             │            │
             ▼            ▼
       Return cache    PostgreSQL
                          │
                          ▼
                     Store in Redis
                          │
                          ▼
                    Return response
```

When user data is modified, the relevant Redis cache entry is invalidated so that stale data is not continuously served.

---

# Conversations

The application supports one-to-one conversations between users.

A conversation stores the relationship between two users and acts as the parent entity for messages.

The backend performs database queries to retrieve conversations and determine the other participant for the authenticated user.

The database uses UUID-based identifiers where applicable.

---

# Real-Time Messaging

Real-time communication is implemented using **Socket.IO**.

REST APIs are responsible for persistent operations and retrieving historical data, while Socket.IO handles events that need to be delivered immediately to connected clients.

A simplified message flow is:

```text
User A
  │
  │ Send message
  ▼
Socket.IO
  │
  ▼
Backend
  │
  ├── Validate user
  │
  ├── Persist message
  │
  └── Emit event
          │
          ▼
      User B
```

This allows messages to appear without requiring the client to repeatedly poll the server.

---

# Socket Authentication

Socket connections are authenticated separately from normal HTTP requests.

During the Socket.IO handshake, the backend reads the authentication cookie and verifies the JWT.

Conceptually:

```text
Socket Connection
       │
       ▼
Read Cookie
       │
       ▼
Extract JWT
       │
       ▼
Verify JWT
       │
   ┌───┴────┐
   │        │
 Valid    Invalid
   │        │
   ▼        ▼
Connect   Reject
```

This ensures that socket-level events are associated with an authenticated user.

---

# Socket.IO Rooms

The application uses the concept of Socket.IO rooms to organize connections.

A conversation can be represented by a room such as:

```text
conversation:<conversationId>
```

A user-specific room can also be used for events that should be delivered directly to a particular user:

```text
user:<userId>
```

This is useful for notifications, presence updates, and other user-specific events.

Rooms allow the backend to target the correct clients instead of broadcasting every event to every connected socket.

---

# Presence System

The application implements an online presence system using Redis.

A user's online state is maintained outside of the Node.js process so that presence information is not tied to a single server instance.

Conceptually:

```text
User connects
     │
     ▼
Socket authenticated
     │
     ▼
Update Redis presence
     │
     ▼
User considered online
```

When the user's connections are no longer active, the presence state can be updated accordingly.

This approach is more suitable for a horizontally scaled application than relying exclusively on an in-memory JavaScript `Map`.

---

# Multiple Socket Connections

A single user can have multiple active connections.

For example:

```text
             User
              │
       ┌──────┼──────┐
       │      │      │
     Laptop  Phone  Browser
       │      │      │
     Socket Socket Socket
```

The presence design therefore needs to distinguish between:

- User identity
- Individual socket connections
- Overall user presence

A user should not immediately become offline simply because one of several socket connections disconnects.

This is an important consideration when implementing presence in a real-world chat system.

---

# Redis

Redis is used for multiple purposes in the application rather than treating it only as a cache.

Current Redis use cases include:

1. Caching
2. User presence
3. Pub/Sub

This demonstrates different Redis data and communication patterns within the same backend.

---

# Redis Caching

The application uses Redis to cache frequently accessed data.

The cache follows the cache-aside pattern.

For example:

```text
GET user
   │
   ▼
Redis?
 ┌─┴──────────┐
 │            │
Yes           No
 │            │
 ▼            ▼
Return      PostgreSQL
              │
              ▼
           Redis SET
              │
              ▼
           Return
```

Cached entries use a TTL so that data does not remain in Redis indefinitely.

Cache invalidation is performed when relevant records are updated.

---

# Redis Pub/Sub

Redis Pub/Sub is used to allow separate backend instances to communicate.

This becomes important when the application is deployed with more than one Node.js server.

Without Pub/Sub:

```text
Client A
   │
   ▼
Server 1
   │
   X
Server 2 does not automatically know
about the event
```

With Redis Pub/Sub:

```text
Client A
   │
   ▼
Server 1
   │
   ▼
Redis Pub/Sub
   │
   ▼
Server 2
   │
   ▼
Client B
```

This allows events generated on one backend instance to be propagated to other backend instances.

The Pub/Sub architecture is therefore an important step toward horizontal scaling.

---

# PostgreSQL

PostgreSQL is the application's primary persistent database.

The database stores the authoritative application state.

The main entities are:

```text
Users
   │
   ├── Conversations
   │       │
   │       └── Messages
   │
   └── User-related data
```

PostgreSQL is used for data that must survive application restarts and Redis failures.

Redis is treated as an auxiliary system rather than the primary source of truth for persistent application data.

---

# Database Relationships

A simplified representation of the relationships is:

```text
┌──────────────┐
│    users     │
└──────┬───────┘
       │
       │ user1_id / user2_id
       ▼
┌──────────────────┐
│  conversations   │
└────────┬─────────┘
         │
         │ conversation_id
         ▼
┌──────────────────┐
│     messages     │
└──────────────────┘
```

A conversation connects two users, while messages belong to a conversation.

---

# Database Indexing

Indexes are used to improve database operations where the application frequently:

- Looks up records by an identifier
- Filters records
- Joins related tables
- Retrieves messages for a conversation
- Orders or searches data using indexed columns

Indexing is especially important for the messages table because chat histories can grow significantly over time.

Indexes are not a universal optimization. They improve specific access patterns while also introducing storage and write-maintenance costs.

---

# Cursor-Based Message Pagination

The chat history uses cursor-based pagination.

Instead of requesting:

```text
page=1
page=2
page=3
```

the client can provide a cursor representing the position from which older messages should be retrieved.

For example:

```http
GET /messages/:conversationId?limit=30&created_at=<cursor>
```

A simplified flow:

```text
Initial request
     │
     ▼
Latest 30 messages
     │
     ▼
Return messages + cursor
     │
     ▼
Client requests older messages
     │
     ▼
Use previous cursor
     │
     ▼
Next batch of messages
```

This approach is well suited to chat applications because new messages can continuously be inserted while users are loading older history.

A maximum page size is also enforced to prevent clients from requesting an unnecessarily large number of records in a single request.

---

# Database Migrations

The current database has been developed using raw PostgreSQL and SQL queries.

The next database-infrastructure step is to introduce versioned SQL migrations so that a fresh PostgreSQL instance can be initialized without relying on a personal database dump.

The intended workflow is:

```text
Clone repository
      │
      ▼
Create .env
      │
      ▼
docker compose up
      │
      ▼
Fresh PostgreSQL
      │
      ▼
Run SQL migrations
      │
      ▼
Required tables and indexes
```

Personal database dumps and application data should not be committed to the repository.

---

# REST API

The backend uses REST APIs for operations that do not require a persistent WebSocket connection.

The API is organized into route groups for areas such as:

- Authentication
- Users
- Conversations
- Messages

The general architecture is:

```text
HTTP Request
     │
     ▼
Router
     │
     ▼
Middleware
     │
     ▼
Controller
     │
     ▼
Service / Database / Redis
     │
     ▼
HTTP Response
```

This separation keeps routing, authentication, business logic, and infrastructure concerns easier to maintain.

---

# Middleware

Middleware is used for cross-cutting backend concerns such as authentication and request processing.

Authentication middleware verifies the JWT associated with the request and makes the authenticated user's identity available to the controller.

Socket authentication follows a similar principle but operates during the Socket.IO connection handshake.

---

# Backend Structure

The backend is organized into separate responsibilities.

A simplified structure is:

```text
server/
├── controllers/
├── routes/
├── middleware/
├── services/
├── sockets/
├── db/
├── redis/
├── utils/
├── app.ts
└── server.ts
```

The exact structure may evolve as the application moves toward production deployment.

### Controllers

Controllers handle incoming requests and coordinate the required operations.

### Routes

Routes define the HTTP endpoints exposed by the backend.

### Middleware

Middleware handles reusable request-level logic such as authentication.

### Services

Services contain reusable application and infrastructure logic.

### Sockets

Socket-related logic handles connection lifecycle, authentication, rooms, and real-time events.

### Database

Database modules manage PostgreSQL connections and queries.

### Redis

Redis modules handle Redis connections and operations such as caching, presence, and Pub/Sub.

---

# Application Startup

The application separates the Express application from the HTTP server startup.

The general startup flow is:

```text
Express Application
       │
       ▼
HTTP Server
       │
       ├── Express HTTP routes
       │
       └── Socket.IO
```

Socket.IO is attached to the HTTP server so that HTTP and WebSocket communication can operate through the same backend process.

---

# CORS

The backend is configured to allow the Angular frontend to communicate with the API while supporting credentials.

Because authentication uses cookies, the server must explicitly configure the allowed frontend origin rather than relying on a wildcard origin.

In production, the allowed origin should be the actual deployed frontend domain.

---

# Environment Variables

Configuration that differs between environments is stored in environment variables.

Example:

```env
PORT=8001

DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=your_database
DB_PASSWORD=your_password
DB_PORT=5432

JWT_SECRET=your_jwt_secret

REDIS_HOST=localhost
REDIS_PORT=6379
```

Actual credentials should never be committed to Git.

A production deployment should use the environment-variable mechanism provided by the hosting platform or deployment infrastructure.

---

# Running Locally

## Prerequisites

Install:

- Node.js
- npm
- PostgreSQL
- Redis
- Git

Docker can also be used to run infrastructure services.

---

## Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

---

## Run the Backend with Docker Compose

The current development setup runs the backend, PostgreSQL, and Redis through Docker Compose.

### Prerequisites

Install:

- Docker Desktop
- Git

### Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

### Configure environment variables

Create a `.env` file in the directory containing `docker-compose.yml`:

```env
DB_USER=your_db_user
DB_HOST=realtime-postgres
DB_NAME=realtime_chat
DB_PASSWORD=your_password
DB_PORT=5432

PORT=8002

JWT_SECRET=your_jwt_secret

REDIS_HOST=redis
REDIS_PORT=6379
```

Do not commit `.env`.

### Start the backend infrastructure

```bash
docker compose up -d --build
```

This starts:

```text
Docker Compose
│
├── chat-server
├── realtime-postgres
└── redis
```

All three services communicate over the `chat-network` Docker network.

### Check running services

```bash
docker compose ps
```

### View backend logs

```bash
docker compose logs -f backend
```

### Connect to PostgreSQL

```bash
docker exec -it realtime-postgres psql -U your_db_user -d realtime_chat
```

### Connect to Redis

```bash
docker exec -it redis redis-cli
```

### Stop the services

```bash
docker compose down
```

The PostgreSQL data is stored in a named Docker volume so that the database persists when the PostgreSQL container is recreated.

### Start the Angular frontend

The Angular frontend can be run separately during development:

```bash
cd client_a
npm install
npm start
```

The exact frontend command may differ depending on the scripts currently configured in `package.json`.

---

# Docker

The backend is containerized using a multi-stage Dockerfile.

The first stage installs dependencies and compiles the TypeScript application. The production stage contains the compiled `dist` output and production dependencies only.

The current local infrastructure is orchestrated with Docker Compose:

```text
                    Docker Compose
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        chat-server     Redis      PostgreSQL
             │            │             │
             └────────────┴─────────────┘
                    chat-network
                          │
                          ▼
                  PostgreSQL volume
```

The Compose configuration:

- Builds the backend from the existing `Dockerfile`
- Runs PostgreSQL 18
- Runs Redis 7
- Connects all services through `chat-network`
- Persists PostgreSQL data using a named Docker volume
- Passes secrets and environment-specific configuration through `.env`
- Exposes the backend on port `8002`

Start the complete backend stack with:

```bash
docker compose up -d --build
```

Stop it with:

```bash
docker compose down
```

Do not commit `.env` or real production credentials to the repository.

### Production Scaling

A typical production architecture can eventually look like:

```text
                  Internet
                     │
                     ▼
                Load Balancer
                     │
             ┌───────┴───────┐
             ▼               ▼
        Backend 1        Backend 2
             │               │
             └───────┬───────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
         PostgreSQL       Redis
```

Running multiple backend instances introduces additional requirements such as:

- Shared Redis
- Shared PostgreSQL
- Pub/Sub
- WebSocket scaling
- Load balancing
- Centralized logging
- Health checks
- Production secret management

These concerns are part of the application's production deployment phase.

---

# Production Architecture

The intended production architecture is designed around separating persistent storage from application instances.

```text
                         ┌─────────────────┐
                         │ Angular Client  │
                         └────────┬────────┘
                                  │
                              HTTPS/WSS
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Load Balancer   │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │ Node.js #1  │             │ Node.js #2  │
             └──────┬──────┘             └──────┬──────┘
                    │                           │
                    └───────────┬───────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌─────────────┐         ┌─────────────┐
             │ PostgreSQL  │         │    Redis    │
             │             │         │             │
             │ Persistent  │         │ Cache       │
             │ Data        │         │ Presence    │
             │             │         │ Pub/Sub     │
             └─────────────┘         └─────────────┘
```

The key principle is that backend instances should remain as stateless as practical, while shared state is handled by external systems such as PostgreSQL and Redis.

---

# Scalability Considerations

The project has been developed with horizontal scaling in mind.

Several design decisions support this:

### PostgreSQL as the source of truth

Persistent data is stored outside the Node.js process.

### Redis for shared ephemeral state

Presence and cache data can be accessed by multiple application instances.

### Redis Pub/Sub

Events can be propagated between backend instances.

### Cursor pagination

Large message histories do not need to be loaded into memory or returned in a single request.

### Database indexes

Frequently accessed query patterns can be optimized as the dataset grows.

### Socket.IO rooms

Messages and events can be targeted to relevant users or conversations rather than globally broadcast.

---

# Security Considerations

The application uses several security-related practices:

- JWT authentication
- HTTP-only authentication cookies
- Authentication middleware
- Socket connection authentication
- Environment variables for secrets
- Controlled CORS configuration
- Database parameterized queries
- Redis credentials/configuration kept outside source code

Production deployment should additionally enforce HTTPS/WSS and use production-grade secret management and security configuration.

---

# Error Handling

Backend controllers use structured error handling around database, Redis, authentication, and request-processing operations.

The application should return appropriate HTTP status codes instead of exposing internal implementation details to clients.

Production deployments should also use centralized logging so that backend failures can be diagnosed without exposing sensitive information to users.

---

# Frontend

The frontend has been migrated from React to Angular.

The Angular application contains areas for:

```text
client_a/
└── src/
    └── app/
        ├── core/
        │   ├── guards/
        │   ├── models/
        │   └── services/
        │
        ├── layout/
        ├── pages/
        │   ├── login/
        │   ├── signup/
        │   ├── dashboard/
        │   ├── conversations/
        │   ├── chat/
        │   └── user-profile/
        │
        └── shared/
            └── components/
```

Core services handle concerns such as authentication, users, chat functionality, and Socket.IO communication.

---

# Project Status

The project has reached the stage where the core backend functionality is implemented and the focus can move toward deployment and production infrastructure.

### Completed

- JWT authentication
- Cookie-based authentication
- User APIs
- Conversation APIs
- PostgreSQL integration
- Socket.IO integration
- Socket authentication
- Real-time messaging
- Socket.IO rooms
- Redis integration
- Redis caching
- Cache invalidation
- Redis-based presence
- Typing indicators
- Redis Pub/Sub
- Cursor-based message pagination
- Database indexing and query optimization work
- Angular frontend migration
- Docker-based infrastructure
- Docker Compose orchestration
- Containerized PostgreSQL with persistent volume
- Containerized Redis
- Backend-to-PostgreSQL and backend-to-Redis Docker networking

### Current Focus

The next major phase is **production deployment**, including infrastructure configuration, environment management, HTTPS, production CORS, health checks, logging, database migrations, and validating the application with multiple backend instances.

---

# Future Improvements

The core architecture is intentionally being completed before adding smaller product features.

Potential future improvements include:

- Read receipts
- Message delivery status
- Message editing
- Message deletion
- Group conversations
- File and image messages
- Notifications
- Rate limiting
- Database migration system using versioned raw SQL migrations
- Automated tests
- CI/CD
- Centralized monitoring
- Metrics and observability
- Load balancing
- More extensive horizontal scaling

These are extensions to the core system rather than prerequisites for the current backend architecture.

---

# Learning Objectives

This project is also a practical backend engineering learning project.

The main concepts demonstrated include:

### Backend Engineering

- REST API design
- Express.js
- TypeScript
- Middleware
- Controllers
- Service architecture
- Error handling

### Databases

- PostgreSQL
- SQL
- Joins
- Relationships
- UUIDs
- Indexing
- Query optimization
- Cursor-based pagination

### Real-Time Systems

- WebSockets
- Socket.IO
- Socket authentication
- Rooms
- Real-time event delivery
- Multi-connection presence

### Redis

- Caching
- TTL
- Cache-aside pattern
- Cache invalidation
- Presence
- Pub/Sub
- Distributed backend communication

### Infrastructure

- Docker
- Environment configuration
- Horizontal scaling
- Load balancing concepts
- Production deployment
- Docker Compose orchestration
- Database migrations

---

# Why This Project Is Designed This Way

A basic chat application can be implemented with a single Node.js process, PostgreSQL, and Socket.IO.

This project intentionally goes beyond that approach.

The goal is to understand what changes when the application needs to become more scalable:

```text
Basic Application
       │
       ▼
REST API + PostgreSQL
       │
       ▼
Real-Time Communication
       │
       ▼
Redis Caching
       │
       ▼
Presence
       │
       ▼
Redis Pub/Sub
       │
       ▼
Multiple Backend Instances
       │
       ▼
Production Deployment
```

Each stage introduces a different backend engineering problem and provides a practical reason for the infrastructure being added.

---

# License

This project is primarily intended for learning, experimentation, and portfolio purposes.
