import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vite-plus/test';

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;

// Node's experimental global `localStorage` shadows jsdom's working
// implementation and only stubs the interface without persisting or
// implementing any of its methods, so components using localStorage
// crash under test unless it's replaced with a real implementation.
class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length() {
        return this.store.size;
    }

    clear() {
        this.store.clear();
    }

    getItem(key: string) {
        return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number) {
        return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string) {
        this.store.delete(key);
    }

    setItem(key: string, value: string) {
        this.store.set(key, String(value));
    }
}

globalThis.localStorage = new MemoryStorage();

afterEach(() => {
    cleanup();
    globalThis.localStorage.clear();
});
