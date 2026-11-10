/**
 * 🔌 API Client - تكامل مع Backend ثقافتنا
 */

import { Platform } from 'react-native';

const API_BASE = 'https://thaqafatna-qr.vercel.app';

const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  async delete(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

// Types
export interface Book {
  id: number; title: string; author: string; description?: string;
  coverImage: string; pdfUrl?: string; pdfPageCount: number;
  difficulty: string; readingTimeMin: number; pages: number;
  language: string; ratingAvg: number; views: number; downloads: number;
  isFeatured: boolean; isPublished: boolean;
  category?: { id: number; name: string; icon: string; color: string };
  _count?: { chapters: number; reviews: number };
}

export interface BookChapter {
  id: number; order: number; title: string; estimatedMinutes: number;
  isFree: boolean; pageStart?: number; pageEnd?: number; content?: string;
}

export interface GameChapter {
  id: number; title: string; description: string; icon: string;
  color: string; order: number; isPublished: boolean;
  _count: { levels: number };
}

export interface GameLevel {
  id: number; number: number; title: string; difficulty: string;
  status: string; isPublished: boolean; reward: number; hintCost: number;
  chapter: { id: number; title: string };
  _count: { words: number };
}

export interface LeaderboardEntry {
  userId: string; userName: string; score: number; completedLevels: number;
}

let authToken: string | null = null;

export async function setAuthToken(token: string | null) {
  authToken = token;
  if (token) await storage.set('auth_token', token);
  else await storage.delete('auth_token');
}

export async function loadAuthToken() {
  try { authToken = await storage.get('auth_token'); } catch {}
}

async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data as T;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const booksApi = {
  list: async (params: { limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    return apiFetch<{ books: Book[]; total: number }>(`/api/books?${query}`);
  },
  get: async (id: number) => apiFetch<{ book: Book }>(`/api/books/${id}`),
  chapters: async (bookId: number) => apiFetch<{ chapters: BookChapter[] }>(`/api/books/${bookId}/chapters`),
  chapter: async (bookId: number, order: number) => apiFetch<{ chapter: BookChapter; totalChapters: number }>(`/api/books/${bookId}/chapters/${order}`),
  bookmark: async (bookId: number, userId: string, action: string = 'toggle') => apiFetch(`/api/books/${bookId}/bookmark`, { method: 'POST', body: JSON.stringify({ userId, action }) }),
  getBookmarks: async (bookId: number, userId: string) => apiFetch<{ bookmarks: any[] }>(`/api/books/${bookId}/bookmark?userId=${encodeURIComponent(userId)}`),
  updateProgress: async (bookId: number, userId: string, data: any) => apiFetch(`/api/books/${bookId}/progress`, { method: 'POST', body: JSON.stringify({ userId, ...data }) }),
  getProgress: async (bookId: number, userId: string) => apiFetch<{ progress: any }>(`/api/books/${bookId}/progress?userId=${encodeURIComponent(userId)}`),
};

export const gameApi = {
  chapters: async () => apiFetch<{ chapters: GameChapter[] }>(`/api/chapters`),
  levels: async (chapterId: number) => apiFetch<{ levels: GameLevel[] }>(`/api/levels?chapterId=${chapterId}`),
  level: async (levelId: number) => apiFetch<{ level: any }>(`/api/levels?id=${levelId}`),
};

export const leaderboardApi = {
  get: async (period: string = 'weekly', userId?: string) => {
    const query = new URLSearchParams({ period });
    if (userId) query.set('userId', userId);
    return apiFetch<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard?${query}`);
  },
};

export const authApi = {
  loginAsGuest: async () => {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await storage.set('user_id', guestId);
    await storage.set('user_name', 'زائر');
    return { userId: guestId, userName: 'زائر' };
  },
  getCurrentUser: async () => {
    const userId = await storage.get('user_id');
    const userName = await storage.get('user_name');
    return userId ? { userId, userName: userName || 'زائر' } : null;
  },
  logout: async () => {
    await storage.delete('user_id');
    await storage.delete('user_name');
    await setAuthToken(null);
  },
};

export { API_BASE };
