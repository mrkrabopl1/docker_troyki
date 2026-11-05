// components/sliders/ContentSliderMixed.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactElement,
  CSSProperties,
} from 'react';
import s from './ContentSliderMixed.module.css';

type ContentSliderMixedProps = {
  content: ReactElement[];
  className?: string;
  stepPx?: number;
  hideArrows?: boolean;
  hideScrollbar?: boolean;
  onPositionChange?: (position: number) => void;
  transitionDuration?: number;
  gap?: number;
  dragThreshold?: number;
  stretchIfSmall?: boolean;
};

const ContentSliderMixed: React.FC<ContentSliderMixedProps> = ({
  content,
  className,
  stepPx,
  hideArrows = false,
  hideScrollbar = false,
  onPositionChange,
  transitionDuration = 300,
  gap = 20,
  dragThreshold = 5,
  stretchIfSmall = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [position, setPosition] = useState(0);

  const [animate, setAnimate] = useState(false);
  const animateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxShift = Math.max(0, trackWidth - containerWidth);

  // ============================================================
  // РАЗМЕРЫ
  // ============================================================
  const measure = useCallback(() => {
    if (!containerRef.current || !trackRef.current) return;
    setContainerWidth(containerRef.current.clientWidth);
    setTrackWidth(trackRef.current.scrollWidth);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    setPosition((p) => Math.max(-maxShift, Math.min(0, p)));
  }, [maxShift]);

  useEffect(() => {
    onPositionChange?.(position);
  }, [position, onPositionChange]);

  // ============================================================
  // ШАГ
  // ============================================================
  const resolvedStep = useMemo(() => {
    if (typeof stepPx === 'number' && stepPx > 0) return stepPx;
    if (trackRef.current?.firstElementChild instanceof HTMLElement) {
      return trackRef.current.firstElementChild.offsetWidth + gap;
    }
    return 200;
  }, [stepPx, trackWidth, gap]);

  const scrollByStep = useCallback(
    (direction: 1 | -1) => {
      setAnimate(true);
      if (animateTimeoutRef.current) clearTimeout(animateTimeoutRef.current);
      animateTimeoutRef.current = setTimeout(
        () => setAnimate(false),
        transitionDuration
      );
      setPosition((prev) =>
        Math.max(-maxShift, Math.min(0, prev - direction * resolvedStep))
      );
    },
    [resolvedStep, maxShift, transitionDuration]
  );

  const canLeft = position < 0;
  const canRight = position > -maxShift;

  // ============================================================
  // DRAG (без setPointerCapture!)
  // ============================================================
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startPos: number;
    moved: boolean;
    active: boolean;
  } | null>(null);

  const [dragging, setDragging] = useState(false);

  // флаг «подавить следующий click» — ставится ТОЛЬКО при реальном drag
  const suppressClickRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('input, select, textarea')) return;

      // ❌ НЕ вызываем setPointerCapture — он убивает click
      // ❌ НЕ вызываем preventDefault — он тоже может убить click на некоторых элементах
      //    (для блокировки native drag на img — CSS + onDragStart)

      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: position,
        moved: false,
        active: true,
      };
      setDragging(true);
      suppressClickRef.current = false;
      setAnimate(false);
    },
    [position]
  );

  // глобальные слушатели, пока идёт drag
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const d = dragStateRef.current;
      if (!d) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (!d.moved) {
        if (Math.abs(dx) > dragThreshold && Math.abs(dx) > Math.abs(dy)) {
          d.moved = true;
        } else {
          return;
        }
      }

      setPosition(Math.max(-maxShift, Math.min(0, d.startPos + dx)));
    };

    const onUp = () => {
      const d = dragStateRef.current;
      dragStateRef.current = null;
      setDragging(false);

      if (d?.moved) {
        suppressClickRef.current = true;
        // сброс через 150ms — click успеет пройти/не пройти
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 150);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, maxShift, dragThreshold]);

  // гасим click, если был drag
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }, []);

  // ============================================================
  // СТИЛИ ТРЕКА
  // ============================================================
  const trackStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      justifyContent:
        stretchIfSmall && maxShift === 0 ? 'space-between' : 'flex-start',
      gap,
      transform: `translateX(${position}px)`,
      transition: animate ? `transform ${transitionDuration}ms ease-out` : 'none',
      willChange: 'transform',
    }),
    [position, animate, transitionDuration, gap, maxShift, stretchIfSmall]
  );

  // ============================================================
  // СКРОЛЛ
  // ============================================================
  const visibleRatio = trackWidth > 0 ? containerWidth / trackWidth : 1;
  const thumbWidthPct = Math.min(100, Math.max(8, visibleRatio * 100));
  const thumbLeftPct =
    maxShift > 0
      ? Math.min(100 - thumbWidthPct, (-position / maxShift) * (100 - thumbWidthPct))
      : 0;

  const scrollbarRef = useRef<HTMLDivElement>(null);
  const scrollDragRef = useRef<{ startX: number; startPos: number } | null>(null);

  // скролл-бар — отдельный drag (можно оставить setPointerCapture, click там не нужен)
  const onScrollbarPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (maxShift <= 0 || !scrollbarRef.current) return;
      e.preventDefault();
      scrollDragRef.current = { startX: e.clientX, startPos: position };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setAnimate(false);
    },
    [position, maxShift]
  );

  const onScrollbarPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!scrollDragRef.current || !scrollbarRef.current) return;
      const barW = scrollbarRef.current.clientWidth;
      const thumbW = (thumbWidthPct / 100) * barW;
      const travel = barW - thumbW;
      if (travel <= 0) return;
      const dx = e.clientX - scrollDragRef.current.startX;
      const deltaPos = (dx / travel) * maxShift;
      setPosition(
        Math.max(-maxShift, Math.min(0, scrollDragRef.current.startPos - deltaPos))
      );
    },
    [maxShift, thumbWidthPct]
  );

  const onScrollbarPointerUp = useCallback((e: React.PointerEvent) => {
    scrollDragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  const showScroll = !hideScrollbar && maxShift > 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={s.wrapper}>
      <div
        ref={containerRef}
        className={s.viewport}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        style={dragging ? { cursor: 'grabbing' } : undefined}
      >
        <div ref={trackRef} className={className} style={trackStyle}>
          {content}
        </div>
      </div>

      {(showScroll || (!hideArrows && maxShift > 0)) && (
        <div className={s.footerBar}>
          {showScroll && (
            <div
              ref={scrollbarRef}
              className={s.scrollbar}
              onPointerDown={onScrollbarPointerDown}
              onPointerMove={onScrollbarPointerMove}
              onPointerUp={onScrollbarPointerUp}
              onPointerCancel={onScrollbarPointerUp}
            >
              <div
                className={s.scrollbarThumb}
                style={{ width: `${thumbWidthPct}%`, left: `${thumbLeftPct}%` }}
              />
            </div>
          )}

          {!hideArrows && maxShift > 0 && (
            <div className={s.arrows}>
              <button
                type="button"
                className={s.arrowBtn}
                onClick={() => scrollByStep(-1)}
                disabled={!canLeft}
                aria-label="Назад"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className={s.arrowBtn}
                onClick={() => scrollByStep(1)}
                disabled={!canRight}
                aria-label="Вперёд"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ContentSliderMixed);