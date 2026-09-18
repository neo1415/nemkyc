import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock CSS imports
vi.mock('*.css', () => ({}));

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom does not implement DataTransfer; tests that drive <input type="file"> need a minimal one.
if (typeof (globalThis as any).DataTransfer === 'undefined') {
  class TestDataTransfer {
    private readonly _files: File[] = [];
    readonly items = {
      add: (file: File) => { this._files.push(file); },
      clear: () => { this._files.length = 0; },
    };
    get files(): FileList {
      const files = this._files;
      const list: any = { length: files.length, item: (i: number) => files[i] ?? null, [Symbol.iterator]: () => files[Symbol.iterator]() };
      files.forEach((f, i) => { list[i] = f; });
      return list as FileList;
    }
  }
  (globalThis as any).DataTransfer = TestDataTransfer;
}
