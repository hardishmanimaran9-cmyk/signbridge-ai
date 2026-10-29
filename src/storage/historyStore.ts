import { settingsStore } from './settingsStore';

export interface HistoryItem {
  id: string;
  message: string;
  language: 'en' | 'ta';
  rawLabel: string;
  confidence: number;
  status: 'recognized' | 'uncertain';
  timestamp: string; // ISO string
}

const STORAGE_KEY = 'signbridge_message_history_v1';

class HistoryStore {
  private items: HistoryItem[] = [];
  private listeners: ((items: HistoryItem[]) => void)[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
      this.items = [];
    }
  }

  getItems(): HistoryItem[] {
    return [...this.items];
  }

  addMessage(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
    const settings = settingsStore.get();
    // Strict compliance: only save if user explicitly enabled history
    if (!settings.historyEnabled) {
      return;
    }

    const newItem: HistoryItem = {
      ...item,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString()
    };

    // Keep most recent 200 messages
    this.items.unshift(newItem);
    if (this.items.length > 200) {
      this.items = this.items.slice(0, 200);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Failed to save message history:', e);
    }

    this.notify();
  }

  deleteItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // ignore
    }
    this.notify();
  }

  clearAll(): void {
    this.items = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notify();
  }

  exportAsText(): string {
    if (this.items.length === 0) {
      return 'No message history recorded.';
    }

    return this.items
      .map(
        (item) =>
          `[${new Date(item.timestamp).toLocaleString()}] (${item.language.toUpperCase()}) "${item.message}" (Sign: ${item.rawLabel}, Conf: ${Math.round(item.confidence * 100)}%)`
      )
      .join('\n');
  }

  subscribe(listener: (items: HistoryItem[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getItems());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const current = this.getItems();
    this.listeners.forEach((l) => l(current));
  }
}

export const historyStore = new HistoryStore();
