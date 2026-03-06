import { useEffect, useRef, useCallback } from 'react';

type Variant = 'fade-up' | 'scale' | 'fade';

interface ScrollRevealOptions {
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  variant?: Variant;
}

export function useScrollReveal<T extends HTMLElement>(options: ScrollRevealOptions | number = {}) {
  // Support legacy numeric delay argument
  const opts: ScrollRevealOptions = typeof options === 'number' ? { delay: options } : options;
  const {
    delay = 0,
    duration = 0.7,
    distance = 32,
    threshold = 0.1,
    variant = 'fade-up',
  } = opts;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

    // Set initial hidden state based on variant
    el.style.opacity = '0';
    if (variant === 'fade-up') {
      el.style.transform = `translateY(${distance}px)`;
    } else if (variant === 'scale') {
      el.style.transform = 'scale(0.95) translateY(16px)';
    }
    // 'fade' — opacity only, no transform needed

    el.style.transition = variant === 'fade'
      ? `opacity ${duration}s ${easing} ${delay}ms`
      : `opacity ${duration}s ${easing} ${delay}ms, transform ${duration}s ${easing} ${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = variant === 'scale' ? 'scale(1) translateY(0)' : 'translateY(0)';
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, duration, distance, threshold, variant]);

  return ref;
}

export function useParallax<T extends HTMLElement>(speed: number) {
  const ref = useRef<T>(null);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
    requestAnimationFrame(() => {
      el.style.transform = `translateY(${scrollOffset * speed}px)`;
    });
  }, [speed]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return ref;
}
