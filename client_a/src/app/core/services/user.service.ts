import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { UserRow } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async getAll(): Promise<{ success: boolean; users?: UserRow[] }> {
    return lastValueFrom(
      this.http.get<{ success: boolean; users?: UserRow[] }>(`${this.base}/user`, {
        withCredentials: true,
      })
    );
  }

  async getById(id: number | string): Promise<{ success: boolean; message?: string }> {
    return lastValueFrom(
      this.http.get<{ success: boolean; message?: string }>(`${this.base}/user/${id}`, {
        withCredentials: true,
      })
    );
  }

  async update(id: number | string, payload: { username?: string; email?: string }): Promise<{ success: boolean; message?: string; user?: UserRow }> {
    try {
      return await lastValueFrom(
        this.http.patch<{ success: boolean; message?: string; user?: UserRow }>(
          `${this.base}/user/${id}`,
          payload,
          { withCredentials: true }
        )
      );
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      return { success: false, message: e?.error?.message ?? 'Update failed.' };
    }
  }

  async delete(id: number | string): Promise<{ success: boolean; message?: string }> {
    try {
      return await lastValueFrom(
        this.http.delete<{ success: boolean; message?: string }>(
          `${this.base}/user/${id}`,
          { withCredentials: true }
        )
      );
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      return { success: false, message: e?.error?.message ?? 'Delete failed.' };
    }
  }
}
