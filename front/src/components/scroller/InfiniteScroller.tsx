import React, { useRef, useCallback, CSSProperties, useEffect } from 'react';

type InfiniteScrollType = {
    className?: string;
    children: React.ReactNode;
    onScroll?: (direction: -1 | 1) => void;
    currentIndex: number;
    maxIndex: number;
};

const InfiniteScroller: React.FC<InfiniteScrollType> = ({ 
    className = '', 
    children,
    onScroll,
    currentIndex,
    maxIndex
}) => {
    const scrollerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    const blockWheel = (e: WheelEvent) => {
        // Блокируем ТОЛЬКО если событие происходит внутри нашего компонента
        if (scrollerRef.current?.contains(e.target as Node)) {
            const direction = e.deltaY > 0 ? 1 : -1;
            
            // Проверяем можно ли скроллить в этом направлении
            const canScrollDown = direction === 1 && currentIndex < maxIndex;
            const canScrollUp = direction === -1 && currentIndex > 0;
            
            // Если МОЖНО скроллить в этом направлении - обрабатываем и блокируем всплытие
            if (canScrollDown || canScrollUp) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                onScroll?.(direction);
                return false;
            }
            
            // Если НЕЛЬЗЯ скроллить в этом направлении - РАЗРЕШАЕМ всплытие
            // Не вызываем preventDefault и stopPropagation
            // Событие пойдет дальше к родительским элементам
        }
        // Если событие вне нашего компонента - пропускаем его
    };

    document.addEventListener('wheel', blockWheel, { 
        capture: true, 
        passive: false 
    });

    return () => {
        document.removeEventListener('wheel', blockWheel, { 
            capture: true 
        });
    };
}, [currentIndex, maxIndex, onScroll]);

    const scrollerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        overflow: "hidden"
    };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Пусто, т.к. вся логика в нативном обработчике
    }, []);

    return (
        <div
            ref={scrollerRef}
            className={className}
            style={scrollerStyle}
            onWheel={handleWheel}
        >
            {children}
        </div>
    );
};

export default React.memo(InfiniteScroller);