import { useRef, useEffect, useState, type ReactNode } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface InfiniteSliderProps {
  children: ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  className?: string;
}

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 40,
  speedOnHover,
  className,
}: InfiniteSliderProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [trackWidth, setTrackWidth] = useState(0);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const measure = () => setTrackWidth(inner.scrollWidth / 2);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [children]);

  useEffect(() => {
    if (trackWidth === 0) return;
    const duration = trackWidth / speed;
    controls.start({
      x: -trackWidth,
      transition: {
        duration,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    });
  }, [trackWidth, speed, controls]);

  const handleHoverStart = () => {
    if (speedOnHover === undefined || trackWidth === 0) return;
    const duration = trackWidth / speedOnHover;
    controls.start({
      x: -trackWidth,
      transition: {
        duration,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    });
  };

  const handleHoverEnd = () => {
    if (speedOnHover === undefined || trackWidth === 0) return;
    const duration = trackWidth / speed;
    controls.start({
      x: -trackWidth,
      transition: {
        duration,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    });
  };

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ overflow: 'hidden' }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <motion.div
        ref={innerRef}
        animate={controls}
        style={{
          display: 'flex',
          gap,
          willChange: 'transform',
          width: 'max-content',
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
