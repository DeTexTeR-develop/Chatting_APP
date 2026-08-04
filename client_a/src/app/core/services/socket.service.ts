import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TypingEvent {
  userId: string;
  conversationId: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  // Presence — BehaviorSubject so late subscribers always get the current list
  readonly onlineUsers$ = new BehaviorSubject<string[]>([]);
  readonly userOnline$ = new Subject<string>();
  readonly userOffline$ = new Subject<string>();

  // Message subject
  readonly message$ = new Subject<unknown>();

  // Typing subjects
  readonly typingStart$ = new Subject<TypingEvent>();
  readonly typingStop$ = new Subject<TypingEvent>();

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

    this.socket.on('conversation:typing:start', (data: TypingEvent) => {
      this.typingStart$.next(data);
    });

    this.socket.on('conversation:typing:stop', (data: TypingEvent) => {
      this.typingStop$.next(data);
    });

    this.socket.on('connect', () => {
      this.socket.emit('get_online_users');
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
    // Reset presence state on disconnect
    this.onlineUsers$.next([]);
  }

  joinConversation(conversationId: string): void {
    this.socket.emit('join_conversation', conversationId);
  }

  emitTypingStart(conversationId: string): void {
    this.socket.emit('conversation:typing:start', { conversationId });
  }

  emitTypingStop(conversationId: string): void {
    this.socket.emit('conversation:typing:stop', { conversationId });
  }

  requestOnlineUsers(): void {
    if (this.socket.connected) {
      this.socket.emit('get_online_users');
    }
    // If not connected yet, the 'connect' event handler will emit get_online_users automatically
  }

  isConnected(): boolean {
    return this.socket.connected;
  }
}
