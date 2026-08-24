import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ConversationRow, MessageRow } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async getConversations(): Promise<{ success: boolean; conversations?: ConversationRow[] }> {
    return lastValueFrom(
      this.http.get<{ success: boolean; conversations?: ConversationRow[] }>(
        `${this.base}/chat`,
        { withCredentials: true }
      )
    );
  }

  async createConversation(userId: number | string): Promise<{ success: boolean; conversation?: ConversationRow; message?: string }> {
    try {
      return await lastValueFrom(
        this.http.post<{ success: boolean; conversation?: ConversationRow; message?: string }>(
          `${this.base}/chat`,
          { userIdForSecond: userId },
          { withCredentials: true }
        )
      );
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      return { success: false, message: e?.error?.message ?? 'Failed to create conversation.' };
    }
  }

  async getMessages(
    conversationId: number | string,
    options: { cursor?: string; limit?: number } = {}
  ): Promise<{ success: boolean; messages?: MessageRow[] }> {
    const params: Record<string, string> = {};
    if (options.cursor) params['created_at'] = options.cursor;
    if (options.limit)  params['limit']      = String(options.limit);

    return lastValueFrom(
      this.http.get<{ success: boolean; messages?: MessageRow[] }>(
        `${this.base}/chat/${conversationId}/messages`,
        { withCredentials: true, params }
      )
    );
  }

  async sendMessage(
    conversationId: number | string,
    content: string,
    media?: File | null
  ): Promise<{ success: boolean; message?: MessageRow }> {
    try {
      const body = new FormData();
      body.append('content', content);
      if (media) {
        body.append('media', media);
      }
      return await lastValueFrom(
        this.http.post<{ success: boolean; message?: MessageRow }>(
          `${this.base}/chat/${conversationId}/messages`,
          body,
          { withCredentials: true }
        )
      );
    } catch {
      return { success: false };
    }
  }
}
