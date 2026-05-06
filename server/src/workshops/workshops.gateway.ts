import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WorkshopsGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WorkshopsGateway.name);

  @SubscribeMessage('subscribe-workshop')
  handleSubscribe(
    @MessageBody('workshopId') workshopId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} subscribed to workshop:${workshopId}`);
    client.join(`workshop:${workshopId}`);
    return { event: 'subscribed', data: { workshopId } };
  }

  @SubscribeMessage('unsubscribe-workshop')
  handleUnsubscribe(
    @MessageBody('workshopId') workshopId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Client ${client.id} unsubscribed from workshop:${workshopId}`,
    );
    client.leave(`workshop:${workshopId}`);
    return { event: 'unsubscribed', data: { workshopId } };
  }

  emitSeatCountUpdate(workshopId: string, availableSeats: number) {
    this.server.to(`workshop:${workshopId}`).emit('seat-count-updated', {
      workshopId,
      availableSeats,
    });
  }
}
