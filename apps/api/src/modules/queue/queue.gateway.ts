import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { QueueService } from './queue.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class QueueGateway {
  @WebSocketServer() server: Server;

  constructor(@Inject(forwardRef(() => QueueService)) private readonly queueService: QueueService) {}

  async broadcastQueueUpdate() {
    const data = await this.queueService.getTvDisplayData();
    if (this.server) this.server.emit('queue-update', data);
  }

  @SubscribeMessage('subscribe-queue')
  handleSubscribe() {
    return { event: 'subscribed', data: 'Listening for queue updates' };
  }
}
