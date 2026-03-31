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
    const [thumbVertPos, setThumbVertPos] = useState(0);
    const [thumbHorPos, setThumbHorPos] = useState(0);

    const scrollerRef = useRef<HTMLDivElement>(null);
    const scrollContRef = useRef<HTMLDivElement>(null);

    const lastTouchRef = useRef({ x: 0, y: 0 });
    const isTouchingRef = useRef(false);
    const touchDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);

    const scrollMetrics = useRef({
        vertSize: 0,
        horSize: 0,
    });

    const getMaxScroll = useCallback(() => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return { maxScrollTop: 0, maxScrollLeft: 0 };
        
        return {
            maxScrollTop: scroller.clientHeight - scrollCont.clientHeight,
            maxScrollLeft: scroller.clientWidth - scrollCont.clientWidth,
        };
    }, []);

    const checkScrollNeeded = useCallback(() => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return;

        const needsHorizontal = scrollCont.clientWidth > scroller.clientWidth;
        const needsVertical = scrollCont.clientHeight > scroller.clientHeight;
        const { maxScrollTop, maxScrollLeft } = getMaxScroll();

        scrollMetrics.current = {
            vertSize: needsVertical ? Math.min(1, scroller.clientHeight / scrollCont.clientHeight) : 0,
            horSize: needsHorizontal ? Math.min(1, scroller.clientWidth / scrollCont.clientWidth) : 0,
        };

        setHasHorizontalScroll(needsHorizontal);
        setHasVerticalScroll(needsVertical);

        if (needsVertical && maxScrollTop !== 0) {
            setThumbVertPos(Math.abs(contTop) / Math.abs(maxScrollTop));
        }
        if (needsHorizontal && maxScrollLeft !== 0) {
            setThumbHorPos(Math.abs(contLeft) / Math.abs(maxScrollLeft));
        }
    }, [contTop, contLeft, getMaxScroll]);

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

        if (maxScroll !== 0) {
            setThumbVertPos(Math.abs(newTop) / Math.abs(maxScroll));
        }
    }, [contTop]);

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

    // Блокируем wheel на уровне DOM
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const preventWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            const delta = e.deltaY > 0 ? -40 : 40;
            scrollVertical(delta);
        };

        scroller.addEventListener('wheel', preventWheel, { passive: false });
        
        return () => {
            scroller.removeEventListener('wheel', preventWheel);
        };
    }, [scrollVertical]);

    // Блокируем touch на уровне DOM
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            isTouchingRef.current = true;
            touchDirectionRef.current = null;
            lastTouchRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!isTouchingRef.current) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - lastTouchRef.current.x;
            const deltaY = currentY - lastTouchRef.current.y;

            if (touchDirectionRef.current === null && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
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
        };

        const handleTouchEnd = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            isTouchingRef.current = false;
            touchDirectionRef.current = null;
        };

        scroller.addEventListener('touchstart', handleTouchStart, { passive: false });
        scroller.addEventListener('touchmove', handleTouchMove, { passive: false });
        scroller.addEventListener('touchend', handleTouchEnd);
        scroller.addEventListener('touchcancel', handleTouchEnd);
        
        return () => {
            scroller.removeEventListener('touchstart', handleTouchStart);
            scroller.removeEventListener('touchmove', handleTouchMove);
            scroller.removeEventListener('touchend', handleTouchEnd);
            scroller.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [scrollVertical, scrollHorizontal, onlyVertical]);

    useEffect(() => {
        const scrollCont = scrollContRef.current;
        const scroller = scrollerRef.current;
        if (!scrollCont || !scroller) return;

        const resizeObserver = new ResizeObserver(() => {
            checkScrollNeeded();
        });

        resizeObserver.observe(scrollCont);
        resizeObserver.observe(scroller);

        return () => resizeObserver.disconnect();
    }, [checkScrollNeeded]);

    useEffect(() => {
        checkScrollNeeded();
        const handleResize = () => checkScrollNeeded();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [checkScrollNeeded]);

    const scrollerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        WebkitOverflowScrolling: "touch",
    };

    const contentStyle: CSSProperties = {
        position: "absolute",
        top: `${contTop}px`,
        left: `${contLeft}px`,
        width: onlyVertical ? "100%" : "auto",
        minWidth: onlyVertical ? "100%" : undefined,
        willChange: "transform",
    };

    return (
        <div
            ref={scrollerRef}
            className={className}
            style={scrollerStyle}
        >
            <div ref={scrollContRef} style={contentStyle}>
                {children}
            </div>

            {hasVerticalScroll && (
                <ScrollerThumb
                    callback={scrollVertical}
                    isVertical={true}
                    kSize={scrollMetrics.current.vertSize}
                    kPos={thumbVertPos}
                />
            )}

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