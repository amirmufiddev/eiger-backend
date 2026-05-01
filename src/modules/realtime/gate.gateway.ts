import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface GateOpenPayload {
  userId: string;
  transactionId: string;
  productIds: string[];
}

interface TicketScannedPayload {
  transactionId: string;
  productId: string;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/gate',
})
export class GateGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitGateOpen(payload: GateOpenPayload) {
    this.server.emit('gate_open', payload);
  }

  emitTicketScanned(payload: TicketScannedPayload) {
    this.server.emit('ticket_scanned', payload);
  }

  emitQuotaExceeded(productId: string, remaining: number) {
    this.server.emit('quota_exceeded', { productId, remaining });
  }
}
