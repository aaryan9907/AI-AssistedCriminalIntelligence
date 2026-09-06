import React, { useEffect, useRef, useState } from 'react';

export interface InteractiveGravityCursorProps {
  enabled?: boolean;
  showControls?: boolean;
  clusterRadius?: number;
  particleCount?: number;
}

export const InteractiveGravityCursor: React.FC<InteractiveGravityCursorProps> = ({
  enabled = true,
}) => {
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorHaloRef = useRef<HTMLDivElement | null>(null);

  const [isEnabled, setIsEnabled] = useState<boolean>(enabled);
  const [isHoveredInteractive, setIsHoveredInteractive] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [isCursorInside, setIsCursorInside] = useState<boolean>(false);

  // High-performance direct coordinates via ref (no state updates on mousemove)
  const mousePos = useRef({ x: -1000, y: -1000 });
  const lerpPos = useRef({ x: -1000, y: -1000 });
  const animFrameId = useRef<number | null>(null);

  // Smooth lerp tracking loop for the cursor follower ring
  useEffect(() => {
    if (!isEnabled) {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    const render = () => {
      const mx = mousePos.current.x;
      const my = mousePos.current.y;

      if (mx > -200 && my > -200) {
        if (lerpPos.current.x < -200) {
          lerpPos.current.x = mx;
          lerpPos.current.y = my;
        } else {
          // Smooth spring interpolation
          lerpPos.current.x += (mx - lerpPos.current.x) * 0.22;
          lerpPos.current.y += (my - lerpPos.current.y) * 0.22;
        }

        // Directly update CSS transform3d for zero-latency 60+ FPS hardware acceleration
        if (cursorDotRef.current) {
          cursorDotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        }
        if (cursorHaloRef.current) {
          cursorHaloRef.current.style.transform = `translate3d(${lerpPos.current.x}px, ${lerpPos.current.y}px, 0)`;
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isEnabled]);

  // Global mouse listeners for precision tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isCursorInside) setIsCursorInside(true);

      // Check if cursor is over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button, a, input, select, textarea, [role="button"], .clickable, .cursor-pointer')
        );
        setIsHoveredInteractive(isInteractive);
      }
    };

    const handleMouseDown = () => {
      setIsMouseDown(true);
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
    };

    const handleMouseLeave = () => {
      setIsCursorInside(false);
      mousePos.current.x = -1000;
      mousePos.current.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isCursorInside]);

  if (!isEnabled) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${
        isCursorInside ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 1. Precision Center Focal Dot (Instant 1:1 mouse tracking) */}
      <div
        ref={cursorDotRef}
        className="absolute top-0 left-0 -ml-[3px] -mt-[3px] pointer-events-none will-change-transform"
      >
        <div
          className={`rounded-full transition-all duration-150 ${
            isMouseDown
              ? 'size-2 bg-signal shadow-[0_0_12px_var(--color-signal)] scale-125'
              : isHoveredInteractive
              ? 'size-2 bg-signal shadow-[0_0_8px_var(--color-signal)] scale-110'
              : 'size-1.5 bg-signal shadow-[0_0_6px_var(--color-signal)]'
          }`}
        />
      </div>

      {/* 2. Smooth Spring-Lerp Halo & Focusing Reticle */}
      <div
        ref={cursorHaloRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200 flex items-center justify-center ${
            isMouseDown
              ? 'size-6 border-signal bg-signal/25 shadow-[0_0_20px_rgba(0,240,255,0.6)] scale-90'
              : isHoveredInteractive
              ? 'size-11 border-signal/80 bg-signal/10 shadow-[0_0_18px_rgba(0,240,255,0.35)] scale-110'
              : 'size-8 border-signal/35 bg-signal/5 shadow-[0_0_12px_rgba(0,240,255,0.18)]'
          }`}
        >
          {/* Active 4-corner targeting brackets when hovering interactive targets */}
          {isHoveredInteractive && (
            <>
              <div className="absolute top-0 w-1.5 h-0.5 bg-signal" />
              <div className="absolute bottom-0 w-1.5 h-0.5 bg-signal" />
              <div className="absolute left-0 h-1.5 w-0.5 bg-signal" />
              <div className="absolute right-0 h-1.5 w-0.5 bg-signal" />
            </>
          )}

          {/* Faint subtle radar sweep ring */}
          <div className="size-full rounded-full border border-signal/15 animate-ping opacity-15" />
        </div>
      </div>
    </div>
  );
};
