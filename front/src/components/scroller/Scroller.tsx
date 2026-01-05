import React, { useRef, useState, useEffect, useCallback, CSSProperties } from 'react';
import ScrollerThumb from './ScrollThubm';

type ScrollType = {
    className?: string;
    children: React.ReactNode;
};

const Scroller: React.FC<ScrollType> = ({ className = '', children }) => {
    const [contTop, setContTop] = useState(0);
    const [contLeft, setContLeft] = useState(0);
    const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false);
    const [hasVerticalScroll, setHasVerticalScroll] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const scrollContRef = useRef<HTMLDivElement>(null);

    const scrollMetrics = useRef({
        vertSize: 0,
        vertPos: 0,
        horSize: 0,
        horPos: 0
    });

    // Инициализация скроллера
    useEffect(() => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;

        if (!scroller || !scrollCont) return;

        const handleWheel = (e: WheelEvent) => e.preventDefault();
        scroller.addEventListener("wheel", handleWheel);

        // Проверка необходимости скролла
        const checkScrollNeeded = () => {
            const needsHorizontal = scrollCont.clientWidth > scroller.clientWidth;
            const needsVertical = scrollCont.clientHeight > scroller.clientHeight;

            scrollMetrics.current = {
                vertSize: needsVertical ? scroller.clientHeight / scrollCont.clientHeight : 0,
                vertPos: 0,
                horSize: needsHorizontal ? scroller.clientWidth / scrollCont.clientWidth : 0,
                horPos: 0
            };

            setHasHorizontalScroll(needsHorizontal);
            setHasVerticalScroll(needsVertical);
        };

        checkScrollNeeded();

        return () => {
            scroller.removeEventListener("wheel", handleWheel);
        };
    }, []);

    // Вертикальный скролл
    const scrollVertical = useCallback((deltaScroll: number, proportion = false) => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return;

        const maxScroll = scroller.clientHeight - scrollCont.clientHeight;
        if (maxScroll >= 0) return;

        //const scrollAmount = proportion ? maxScroll * deltaScroll : deltaScroll;
        let newTop = proportion ? maxScroll * deltaScroll : contTop + deltaScroll;

        if (newTop > 0) {
            newTop = 0;
            scrollMetrics.current.vertPos = 0;
        } else if (newTop < maxScroll) {
            newTop = maxScroll;
            scrollMetrics.current.vertPos = 1;
        } else {
            scrollMetrics.current.vertPos = proportion ? deltaScroll : newTop / maxScroll;
        }

        setContTop(newTop);
    }, [contTop]);

    // Горизонтальный скролл
    const scrollHorizontal = useCallback((deltaScroll: number, proportion = false) => {
        const scroller = scrollerRef.current;
        const scrollCont = scrollContRef.current;
        if (!scroller || !scrollCont) return;

        const maxScroll = scroller.clientWidth - scrollCont.clientWidth;
        if (maxScroll >= 0) return;

        const scrollAmount = proportion ? maxScroll * deltaScroll : deltaScroll;
        let newLeft = contLeft + scrollAmount;

        if (newLeft > 0) {
            newLeft = 0;
            scrollMetrics.current.horPos = 0;
        } else if (newLeft < maxScroll) {
            newLeft = maxScroll;
            scrollMetrics.current.horPos = 1;
        } else {
            scrollMetrics.current.horPos = newLeft / maxScroll;
        }

        setContLeft(newLeft);
    }, [contLeft]);

    // Обработчик колеса мыши
    const handleWheel = useCallback((e: React.WheelEvent) => {
        // e.preventDefault();
        // e.stopPropagation();
        scrollVertical(e.deltaY > 0 ? -10 : 10);
    }, [scrollVertical]);

    // Стили
    const scrollerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height:"100%",
        overflow: "hidden",
        ...(className ? { className } : {})
    };

    const contentStyle: CSSProperties = {
        position: "absolute",
        top: `${contTop}px`,
        left: `${contLeft}px`,
    };

    return (
        <div
            ref={scrollerRef}
            className={className}
            style={scrollerStyle}
            onWheel={handleWheel}
            onScroll={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
        >
            <div ref={scrollContRef} style={contentStyle}>
                {children}
            </div>

            {hasVerticalScroll && (
                <ScrollerThumb
                    callback={scrollVertical}
                    isVertical={true}
                    kSize={scrollMetrics.current.vertSize}
                    kPos={scrollMetrics.current.vertPos}
                />
            )}

            {hasHorizontalScroll && (
                <ScrollerThumb
                    callback={scrollHorizontal}
                    isVertical={false}
                    kSize={scrollMetrics.current.horSize}
                    kPos={scrollMetrics.current.horPos}
                />
            )}
        </div>
    );
};

export default React.memo(Scroller);