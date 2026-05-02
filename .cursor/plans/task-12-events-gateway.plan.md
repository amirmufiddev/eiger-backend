---
name: task-12-events-gateway
overview: "Task 12: Events Gateway - WebSocket dengan Redis Adapter"
todos:
  - id: 1
    content: "Buat GitHub Issue untuk Task 12"
    status: pending
  - id: 2
    content: "Buat directory src/events/"
    status: pending
  - id: 3
    content: "Buat EventsGateway dengan Socket.io + Redis adapter"
    status: pending
  - id: 4
    content: "Buat EventsModule"
    status: pending
  - id: 5
    content: "Update AppModule import EventsModule"
    status: pending
  - id: 6
    content: "Verify build successful"
    status: pending
  - id: 7
    content: "Buat PR ke branch task/12-events-gateway"
    status: pending
isProject: false
---

# Plan: Task 12 - Events Gateway

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

## Workflow

| Fase | Aktivitas | Skill |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1 | Buat GitHub Issue untuk task ini | `issue_write` MCP tool |
| 2 | Implementasi Events Gateway | `/executing-plans` |
| 3 | Buat PR setelah selesai | `/finishing-a-development-branch` |

### Fase 1 - Create GitHub Issue

Gunakan `issue_write` tool dari `user-github-mcp-server` MCP:

```
method: "create"
owner: "amirmufiddev"
repo: "eiger-backend"
title: "[Task 12] Events Gateway - WebSocket dengan Redis Adapter"
body: (isi overview)
labels: ["backend", "task-12", "priority:P1"]
```

Catatan: Pastikan read tool schema `issue_write.json` terlebih dahulu sebelum调用.

---

## 1. Overview

Events gateway untuk WebSocket real-time communication dengan Socket.io dan Redis adapter untuk distributed deployment.

---

## 2. Files to Create

```
backend/src/events/
├── events.module.ts
└── events.gateway.ts
```

---

## 3. Implementation

### Step 1: Create EventsGateway

```typescript
// src/events/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../infrastructure/redis/redis.module';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.server.adapter(createAdapter(pubClient, subClient));
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('subscribe:transaction')
  handleSubscribeTransaction(
    @MessageBody() data: { transactionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`transaction:${data.transactionId}`);
    return { event: 'subscribed', room: `transaction:${data.transactionId}` };
  }

  @SubscribeMessage('unsubscribe:transaction')
  handleUnsubscribeTransaction(
    @MessageBody() data: { transactionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`transaction:${data.transactionId}`);
    return { event: 'unsubscribed', room: `transaction:${data.transactionId}` };
  }

  emitTransactionUpdate(transactionId: string, data: unknown) {
    this.server.to(`transaction:${transactionId}`).emit('transaction:update', data);
  }

  emitMembershipUpdate(userId: string, data: unknown) {
    this.server.to(`user:${userId}`).emit('membership:update', data);
  }

  emitWalletUpdate(userId: string, data: unknown) {
    this.server.to(`user:${userId}`).emit('wallet:update', data);
  }

  emitNotification(userId: string, message: string, type: 'success' | 'error' | 'info') {
    this.server.to(`user:${userId}`).emit('notification', { message, type });
  }
}
```

### Step 2: Create EventsModule

```typescript
// src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { RedisModule } from '../infrastructure/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
```

### Step 3: Update AppModule

```typescript
// src/app.module.ts (add EventsModule to imports)
import { EventsModule } from './events/events.module';

// In imports array:
EventsModule,
```

---

## 4. GitHub Issue & PR

### Create Issue

Title: `[Task 12] Events Gateway - WebSocket with Redis Adapter`
Labels: `backend`, `task-12`, `priority:P1`

### After Implementation - Create PR

```bash
git checkout -b task/12-events-gateway
git add -A
git commit -m "feat: implement events gateway with Redis adapter"
git push -u origin task/12-events-gateway
```

---

## 5. Verification Checklist

- [ ] WebSocket server starts
- [ ] Redis adapter configured
- [ ] Client connection/disconnection handled
- [ ] Room subscription works
- [ ] Build successful
- [ ] GitHub issue created
- [ ] PR created
