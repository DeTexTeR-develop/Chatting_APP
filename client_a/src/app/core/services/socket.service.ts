import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  // Presence subjects
  readonly onlineUsers$ = new Subject<string[]>();
  readonly userOnline$ = new Subject<string>();
  readonly userOffline$ = new Subject<string>();

  // Message subject
  readonly message$ = new Subject<unknown>();

  constructor() {
    this.socket = io(environment.apiBaseUrl, {
      withCredentials: true,
      autoConnect: false,
    });

    this.socket.on('online_users', (data: { userIds: string[] }) => {
      this.onlineUsers$.next(data.userIds);
    });

    this.socket.on('user_online', (data: { userId: string }) => {
      this.userOnline$.next(data.userId);
    });

    this.socket.on('user_offline', (data: { userId: string }) => {
      this.userOffline$.next(data.userId);
    });

    this.socket.on('receive_message', (data: unknown) => {
      this.message$.next(data);
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
    // Re-request online list after connecting
    this.socket.on('connect', () => {
      this.socket.emit('get_online_users');
    });
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  joinConversation(conversationId: string): void {
    this.socket.emit('join_conversation', conversationId);
  }

  requestOnlineUsers(): void {
    if (this.socket.connected) {
      this.socket.emit('get_online_users');
    }
  }

  isConnected(): boolean {
    return this.socket.connected;
  }
}
