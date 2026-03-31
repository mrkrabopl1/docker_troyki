import React, { useRef, useState, useEffect, useCallback, CSSProperties } from 'react';
import ScrollerThumb from './ScrollThumb';

type ScrollType = {
    className?: string;
    children: React.ReactNode;
    onlyVertical?: boolean;
};

const Scroller: React.FC<ScrollType> = ({ className = '', children, onlyVertical = false }) => {
    const [contTop, setContTop] = useState(0);
    const [contLeft, setContLeft] = useState(0);
    const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
    const [hasVerticalScroll, setHasVerticalScroll] = useState(false);

    // Новые состояния для позиции ползунка — они будут обновляться сразу
    const [thumbVertPos, setThumbVertPos] = useState(0);
    const [thumbHorPos, setThumbHorPos] = useState(0);

    const scrollerRef = useRef<HTMLDivElement>(null);
    const scrollContRef = useRef<HTMLDivElement>(null);

    // Для touch-событий
    const lastTouchRef = useRef({ x: 0, y: 0 });
    const isTouchingRef = useRef(false);
    const touchDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);

    const scrollMetrics = useRef({
        vertSize: 0,
        horSize: 0,
    });

    // Пересчёт необходимости скролла и размера ползунка
    const checkScrollNeeded = useCallback(() => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return;

        const needsHorizontal = scrollCont.clientWidth > scroller.clientWidth;
        const needsVertical = scrollCont.clientHeight > scroller.clientHeight;

        const maxScrollTop = scroller.clientHeight - scrollCont.clientHeight;
        const maxScrollLeft = scroller.clientWidth - scrollCont.clientWidth;

        scrollMetrics.current = {
            vertSize: needsVertical ? Math.min(1, scroller.clientHeight / scrollCont.clientHeight) : 0,
            horSize: needsHorizontal ? Math.min(1, scroller.clientWidth / scrollCont.clientWidth) : 0,
        };

        setHasHorizontalScroll(needsHorizontal);
        setHasVerticalScroll(needsVertical);

        // Обновляем позицию ползунка при ресайзе
        if (needsVertical && maxScrollTop !== 0) {
            setThumbVertPos(Math.abs(contTop) / maxScrollTop);
        }
        if (needsHorizontal && maxScrollLeft !== 0) {
            setThumbHorPos(Math.abs(contLeft) / maxScrollLeft);
        }
    }, [contTop, contLeft]);

    useEffect(() => {
        checkScrollNeeded();
        const handleResize = () => checkScrollNeeded();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [checkScrollNeeded, children]);

    // Вертикальный скролл
    const scrollVertical = useCallback((deltaScroll: number, proportional = false) => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return;

        const maxScroll = scroller.clientHeight - scrollCont.clientHeight;
        if (maxScroll >= 0) return;

        let newTop: number;
        if (proportional) {
            newTop = maxScroll * deltaScroll;
        } else {
            newTop = contTop + deltaScroll;
        }

        newTop = Math.min(0, Math.max(newTop, maxScroll));

        setContTop(newTop);

        // Обновляем позицию ползунка сразу
        if (maxScroll !== 0) {
            setThumbVertPos(Math.abs(newTop) / maxScroll);
        }
    }, [contTop]);

    // Горизонтальный скролл
    const scrollHorizontal = useCallback((deltaScroll: number, proportional = false) => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return;

        const maxScroll = scroller.clientWidth - scrollCont.clientWidth;
        if (maxScroll >= 0) return;

        let newLeft: number;
        if (proportional) {
            newLeft = maxScroll * deltaScroll;
        } else {
            newLeft = contLeft + deltaScroll;
        }

        newLeft = Math.min(0, Math.max(newLeft, maxScroll));

        setContLeft(newLeft);

        if (maxScroll !== 0) {
            setThumbHorPos(Math.abs(newLeft) / maxScroll);
        }
    }, [contLeft]);

    // ================== TOUCH EVENTS ==================
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        isTouchingRef.current = true;
        touchDirectionRef.current = null;
        lastTouchRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isTouchingRef.current) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        const deltaX = currentX - lastTouchRef.current.x;
        const deltaY = currentY - lastTouchRef.current.y;

        if (touchDirectionRef.current === null && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
            touchDirectionRef.current = onlyVertical || Math.abs(deltaY) > Math.abs(deltaX)
                ? 'vertical'
                : 'horizontal';
        }

        if (touchDirectionRef.current === 'vertical') {
            scrollVertical(deltaY);
        } else if (touchDirectionRef.current === 'horizontal' && !onlyVertical) {
            scrollHorizontal(deltaX);
        }

        lastTouchRef.current = { x: currentX, y: currentY };
    }, [scrollVertical, scrollHorizontal, onlyVertical]);

    const handleTouchEnd = useCallback(() => {
        isTouchingRef.current = false;
        touchDirectionRef.current = null;
    }, []);

    // Wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -40 : 40;
        scrollVertical(delta);
    }, [scrollVertical]);

    const scrollerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: onlyVertical ? "pan-y" : "pan-x pan-y",
        WebkitOverflowScrolling: "touch",
    };

    const contentStyle: CSSProperties = {
        position: "absolute",
        top: `${contTop}px`,
        left: `${contLeft}px`,
        width: onlyVertical ? "100%" : "auto",
        minWidth: onlyVertical ? "100%" : undefined,
    };

    return (
        <div
            ref={scrollerRef}
            className={className}
            style={scrollerStyle}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <div ref={scrollContRef} style={contentStyle}>
                {children}
            </div>

            {/* Ползунок вертикальный */}
            {hasVerticalScroll && (
                <ScrollerThumb
                    callback={scrollVertical}
                    isVertical={true}
                    kSize={scrollMetrics.current.vertSize}
                    kPos={thumbVertPos}           // ← используем новое состояние
                />
            )}

            {/* Ползунок горизонтальный */}
            {!onlyVertical && hasHorizontalScroll && (
                <ScrollerThumb
                    callback={scrollHorizontal}
                    isVertical={false}
                    kSize={scrollMetrics.current.horSize}
                    kPos={thumbHorPos}
                />
            )}
        </div>
    );
};

export default React.memo(Scroller);