// Performance optimizations
import { useMemo, useCallback, memo } from "react";

// Memoize expensive computations
export const useMemoized = <T,>(fn: () => T, deps: any[]): T => {
  return useMemo(fn, deps);
};

// Debounce function calls
export const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle function calls
export const throttle = (fn: Function, delay: number) => {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

// Lazy load component
export const lazyLoad = (importFunc: () => Promise<any>) => {
  return memo(importFunc);
};

// Cache API responses
export const createCache = () => {
  const cache = new Map<string, { data: any; timestamp: number }>();
  const TTL = 5 * 60 * 1000; // 5 minutes

  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (item && Date.now() - item.timestamp < TTL) {
        return item.data;
      }
      cache.delete(key);
      return null;
    },
    set: (key: string, data: any) => {
      cache.set(key, { data, timestamp: Date.now() });
    },
    clear: () => cache.clear(),
  };
};

// Virtual scroll helper
export const useVirtualScroll = (items: any[], itemHeight: number, containerHeight: number) => {
  const scrollTop = 0;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = startIndex + visibleCount;

  return {
    visibleItems: items.slice(startIndex, endIndex),
    offsetY: startIndex * itemHeight,
    totalHeight: items.length * itemHeight,
  };
};
