import { put, del, list } from '@vercel/blob';
import { User, Event, ApiResponse } from '../types';

const BLOB_READ_WRITE_TOKEN = import.meta.env.VITE_BLOB_READ_WRITE_TOKEN;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const IS_DEVELOPMENT = import.meta.env.DEV;

if (!IS_DEVELOPMENT && !BLOB_READ_WRITE_TOKEN) {
  console.error('VITE_BLOB_READ_WRITE_TOKEN is not defined in production environment');
}

export class BlobService {
  private static async saveData<T>(key: string, data: T): Promise<ApiResponse<T>> {
    try {
      if (IS_DEVELOPMENT) {
        console.log('Saving data in development mode:', { key, data });
        const response = await fetch(`${API_URL}/blob/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: key, data: data }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save data');
        }
        
        return { success: true, data };
      } else {
        if (!BLOB_READ_WRITE_TOKEN) {
          throw new Error('BLOB_READ_WRITE_TOKEN is not defined');
        }
        const blob = await put(key, JSON.stringify(data), {
          access: 'public',
          token: BLOB_READ_WRITE_TOKEN,
        });
        
        return { success: true, data };
      }
    } catch (error) {
      console.error('Error saving data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  private static async getData<T>(key: string): Promise<ApiResponse<T>> {
    try {
      console.log('Getting data for key:', key);
      console.log('IS_DEVELOPMENT:', IS_DEVELOPMENT);
      if (IS_DEVELOPMENT) {
        const response = await fetch(`${API_URL}/blob`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });
        if (!response.ok) {
          throw new Error('Data not found');
        }
        const data = await response.json();
        return { success: true, data };
      } else {
        if (!BLOB_READ_WRITE_TOKEN) {
          throw new Error('BLOB_READ_WRITE_TOKEN is not defined');
        }
        const { blobs } = await list({ 
          token: BLOB_READ_WRITE_TOKEN,
          prefix: key
        });
        
        if (blobs.length === 0) {
          throw new Error('Data not found');
        }

        // Find the blob that matches our key pattern
        const blob = blobs.find(b => b.pathname === key || b.pathname === `${key}/`);
        if (!blob) {
          throw new Error('Data not found');
        }

        // Use the downloadUrl instead of url to avoid CORS issues
        const response = await fetch(blob.downloadUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        return { success: true, data };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  // User operations
  static async saveUser(user: User): Promise<ApiResponse<User>> {
    try {
      // First get all users
      const usersResponse = await this.getData<User[]>('users/users.json');
      if (!usersResponse.success) {
        throw new Error(usersResponse.error);
      }

      // Ensure we always have an array
      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        users[index] = user;
      } else {
        users.push(user);
      }

      // Save all users back to the blob
      await this.saveData('users/users.json', users);
      return { success: true, data: user };
    } catch (error) {
      console.error('Error saving user:', error);
      return { success: false, error: 'Failed to save user' };
    }
  }

  static async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const usersResponse = await this.getData<User[]>('users/');
      if (!usersResponse.success) {
        throw new Error(usersResponse.error);
      }

      // Ensure we always have an array
      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const user = users.find(u => u.id === id);
      if (!user) {
        throw new Error('User not found');
      }

      return { success: true, data: user };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: 'Failed to get user' };
    }
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      // First get all users
      const usersResponse = await this.getData<User[]>('users/users.json');
      if (!usersResponse.success) {
        throw new Error(usersResponse.error);
      }

      // Ensure we always have an array
      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const filteredUsers = users.filter(u => u.id !== id);

      // Save the updated users list
      await this.saveData('users/users.json', filteredUsers);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  }

  static async updateUser(user: User): Promise<ApiResponse<User>> {
    return this.saveUser(user);
  }

  static async listUsers(): Promise<ApiResponse<User[]>> {
    try {
      const usersResponse = await this.getData<User[]>('users/users.json');
      if (!usersResponse.success) {
        throw new Error(usersResponse.error);
      }

      // Ensure we always return an array
      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      return { success: true, data: users };
    } catch (error) {
      console.error('Error listing users:', error);
      return { success: false, error: 'Failed to list users' };
    }
  }

  // Event operations
  static async saveEvent(event: Event): Promise<ApiResponse<Event>> {
    try {
      // First get all events
      const eventsResponse = await this.getData<Event[]>('events/events.json');
      if (!eventsResponse.success) {
        throw new Error(eventsResponse.error);
      }

      // Ensure we always have an array
      const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      const index = events.findIndex(e => e.id === event.id);
      if (index >= 0) {
        events[index] = event;
      } else {
        events.push(event);
      }

      // Save all events back to the blob
      await this.saveData('events/events.json', events);
      return { success: true, data: event };
    } catch (error) {
      console.error('Error saving event:', error);
      return { success: false, error: 'Failed to save event' };
    }
  }

  static async getEvent(id: string): Promise<ApiResponse<Event>> {
    try {
      const eventsResponse = await this.getData<Event[]>('events/events.json');
      if (!eventsResponse.success) {
        throw new Error(eventsResponse.error);
      }

      // Ensure we always have an array
      const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      const event = events.find(e => e.id === id);
      if (!event) {
        throw new Error('Event not found');
      }

      return { success: true, data: event };
    } catch (error) {
      console.error('Error getting event:', error);
      return { success: false, error: 'Failed to get event' };
    }
  }

  static async deleteEvent(id: string): Promise<ApiResponse<void>> {
    try {
      // First get all events
      const eventsResponse = await this.getData<Event[]>('events/events.json');
      if (!eventsResponse.success) {
        throw new Error(eventsResponse.error);
      }

      // Ensure we always have an array
      const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      const filteredEvents = events.filter(e => e.id !== id);

      // Save the updated events list
      await this.saveData('events/events.json', filteredEvents);
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: 'Failed to delete event' };
    }
  }

  static async updateEvent(event: Event): Promise<ApiResponse<Event>> {
    return this.saveEvent(event);
  }

  static async listEvents(): Promise<ApiResponse<Event[]>> {
    try {
      const eventsResponse = await this.getData<Event[]>('events/events.json');
      if (!eventsResponse.success) {
        throw new Error(eventsResponse.error);
      }

      // Ensure we always return an array
      const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : [];
      return { success: true, data: events };
    } catch (error) {
      console.error('Error listing events:', error);
      return { success: false, error: 'Failed to list events' };
    }
  }

  static async getEventParticipants(eventId: string): Promise<ApiResponse<User[]>> {
    try {
      const eventResponse = await this.getEvent(eventId);
      if (!eventResponse.success || !eventResponse.data) {
        throw new Error('Event not found');
      }

      const usersResponse = await this.listUsers();
      if (!usersResponse.success || !usersResponse.data) {
        throw new Error('Failed to get users');
      }
      const participants = usersResponse.data.filter(user => 
        eventResponse.data?.participants?.some(p => p?.userId === user.id)
      );

      return { success: true, data: participants };
    } catch (error) {
      console.error('Error getting event participants:', error);
      return { success: false, error: 'Failed to get event participants' };
    }
  }
} 