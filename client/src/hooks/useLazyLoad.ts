import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  onVisible?: () => void;
}

/**
 * Hook para lazy loading com Intersection Observer
 * Útil para carregar componentes quando ficam visíveis na tela
 */
export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    onVisible,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.();
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, onVisible]);

  return { ref, isVisible };
}

/**
 * Hook para virtual scrolling de listas grandes
 * Renderiza apenas os itens visíveis na viewport
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
  const visibleItems = items.slice(startIndex, Math.min(endIndex + 1, items.length));

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  const offsetY = startIndex * itemHeight;

  return {
    containerRef,
    visibleItems,
    offsetY,
    handleScroll,
    totalHeight: items.length * itemHeight,
  };
}

/**
 * Hook para debounce de valores
 * Útil para otimizar re-renders em filtros e buscas
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle de funções
 * Útil para otimizar event listeners (scroll, resize, etc)
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Hook para prefetch de dados
 * Carrega dados antes do componente ficar visível
 */
export function usePrefetch<T>(
  fetcher: () => Promise<T>,
  options: UseLazyLoadOptions = {}
) {
  const { ref, isVisible } = useLazyLoad({
    ...options,
    rootMargin: '200px', // Prefetch 200px antes de ficar visível
  });

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isVisible || data) return;

    setLoading(true);
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [isVisible, fetcher, data]);

  return { ref, data, loading, error };
}
