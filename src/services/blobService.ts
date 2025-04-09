import { put, del } from '@vercel/blob';
import { User, Event, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const BLOB_READ_WRITE_TOKEN = import.meta.env.VITE_BLOB_TOKEN;

export class BlobService {
  private static async saveData<T>(key: string, data: T): Promise<ApiResponse<T>> {
    try {
      const blob = await put(key, JSON.stringify(data), {
        access: 'public',
        token: BLOB_READ_WRITE_TOKEN,
      });
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  private static async getData<T>(key: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_URL}/blob/${key}`);
      if (!response.ok) {
        throw new Error('Data not found');
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  private static async listData<T>(prefix: string): Promise<ApiResponse<T[]>> {
    try {
      const response = await fetch(`${API_URL}/list?prefix=${encodeURIComponent(prefix)}`);
      
      if (!response.ok) {
        throw new Error('Failed to list data');
      }

      const { blobs } = await response.json();
      const items: T[] = [];

      for (const blob of blobs) {
        const itemResponse = await fetch(`${API_URL}/blob/${blob.pathname}`);
        if (itemResponse.ok) {
          const item = await itemResponse.json();
          items.push(item);
        }
      }

      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // User operations
  static async saveUser(user: User): Promise<ApiResponse<User>> {
    return this.saveData(`users/${user.id}.json`, user);
  }

  static async getUser(userId: string): Promise<ApiResponse<User>> {
    return this.getData(`users/${userId}.json`);
  }

  static async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      await del(`users/${userId}.json`, { token: BLOB_READ_WRITE_TOKEN });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async listUsers(): Promise<ApiResponse<User[]>> {
    return this.listData<User>('users/');
  }

  // Event operations
  static async saveEvent(event: Event): Promise<ApiResponse<Event>> {
    return this.saveData(`events/${event.id}.json`, event);
  }

  static async getEvent(eventId: string): Promise<ApiResponse<Event>> {
    return this.getData(`events/${eventId}.json`);
  }

  static async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    try {
      await del(`events/${eventId}.json`, { token: BLOB_READ_WRITE_TOKEN });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async listEvents(): Promise<ApiResponse<Event[]>> {
    return this.listData<Event>('events/');
  }
} 