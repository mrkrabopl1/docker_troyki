import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import MerchBlock from "./MerchBlock";
import s from "./style.module.css";

interface MerchInterface {
    name: string;
    imgs: string[];
    id: string;
    price: string;
    className?: string;
}

interface MerchFieldProps {
    className?: string;
    size: number;
    data: MerchInterface[];
    onScrollPosition?: (currentIndex: number, visibleRange: { start: number; end: number }) => void;
    onScrollToBottom?: () => void;
    onScrollToTop?: () => void;
    loading?: boolean;
    totalItems?: number;
}

interface MerchFieldRef {
    scrollToTop: () => void;
    scrollToPosition: (position: number) => void;
    getCurrentPosition: () => number;
}

const MerchFieldWithScroll = React.forwardRef<MerchFieldRef, MerchFieldProps>(({ 
    data = [],
    size,
    className,
    totalItems,
    onScrollPosition,
    onScrollToBottom,
    onScrollToTop
}, ref) => {
    const [scrollOffset, setScrollOffset] = useState(0);
    const [startLoadedRow, setStartLoadedRow] = useState(0);
    const rowHeight = 200;
    const rowsPerView = 3;
    const bufferRows = 5;
    
    const containerRef = useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            setScrollOffset(0);
        },
        scrollToPosition: (position: number) => {
            setScrollOffset(position);
        },
        getCurrentPosition: () => {
            return scrollOffset;
        }
    }), [scrollOffset]);

    const totalRows = useMemo(() => {
        const total = totalItems || data.length;
        return Math.ceil(total / size);
    }, [totalItems, data.length, size]);

    const totalHeight = totalRows * rowHeight;

    const currentRowIndex = Math.floor(scrollOffset / rowHeight);

    const visibleRange = useMemo(() => {
        const start = Math.max(0, currentRowIndex);
        const end = Math.min(totalRows, currentRowIndex + rowsPerView);
        return { start, end };
    }, [currentRowIndex, totalRows, rowsPerView]);

    const bufferRange = useMemo(() => {
        const start = Math.max(0, currentRowIndex - bufferRows);
        const end = Math.min(totalRows, currentRowIndex + rowsPerView + bufferRows);
        return { start, end };
    }, [currentRowIndex, totalRows, rowsPerView, bufferRows]);

    useEffect(() => {
        if (data.length > 0) {
            const currentStartRow = Math.floor(scrollOffset / rowHeight);
            setStartLoadedRow(currentStartRow);
        }
    }, [data.length, scrollOffset, rowHeight]);

    const checkTopLoad = useCallback((newCurrentRowIndex: number) => {
        const loadedRows = Math.ceil(data.length / size);
        const totalAvailableRows = totalItems ? Math.ceil(totalItems / size) : loadedRows;
        
        if (Math.max(0, newCurrentRowIndex - bufferRows) < startLoadedRow && loadedRows < totalAvailableRows) {
            onScrollToTop?.();
        }
    }, [data.length, size, totalItems, bufferRows, startLoadedRow, onScrollToTop]);

    const checkBottomLoad = useCallback((newCurrentRowIndex: number) => {
        const loadedRows = Math.ceil(data.length / size);
        const totalAvailableRows = totalItems ? Math.ceil(totalItems / size) : loadedRows;
        
        if (newCurrentRowIndex >= loadedRows - rowsPerView - bufferRows && loadedRows < totalAvailableRows) {
            onScrollToBottom?.();
        }
    }, [data.length, size, totalItems, rowsPerView, bufferRows, onScrollToBottom]);

    const updateScroll = useCallback((deltaY: number) => {
        const container = containerRef.current;
        if (!container) return;

        const containerHeight = container.clientHeight;
        const maxScroll = Math.max(0, totalHeight - containerHeight);
        
        let newScrollOffset = scrollOffset + deltaY;
        newScrollOffset = Math.max(0, Math.min(newScrollOffset, maxScroll));
        
        setScrollOffset(newScrollOffset);

        const newCurrentRowIndex = Math.floor(newScrollOffset / rowHeight);
        const newVisibleRange = {
            start: Math.max(0, newCurrentRowIndex),
            end: Math.min(totalRows, newCurrentRowIndex + rowsPerView)
        };

        onScrollPosition?.(newCurrentRowIndex, newVisibleRange);

        if (deltaY > 0) {
            checkBottomLoad(newCurrentRowIndex);
        } else if (deltaY < 0) {
            checkTopLoad(newCurrentRowIndex);
        }
    }, [scrollOffset, totalHeight, rowHeight, totalRows, rowsPerView, onScrollPosition, checkBottomLoad, checkTopLoad]);

    // Основная логика: проверяем можно ли скроллить внутренний контент
    const handleWheel = useCallback((e: WheelEvent) => {
        const container = containerRef.current;
        if (!container) return;

        const deltaY = e.deltaY;
        const containerHeight = container.clientHeight;
        const maxScroll = Math.max(0, totalHeight - containerHeight);
        const currentScroll = scrollOffset;
        
        // Проверяем, можем ли мы скроллить вниз
        const canScrollDown = deltaY > 0 && currentScroll < maxScroll;
        // Проверяем, можем ли мы скроллить вверх
        const canScrollUp = deltaY < 0 && currentScroll > 0;
        
        // Если можем скроллить внутренний контент
        if (canScrollDown || canScrollUp) {
            // Блокируем внешний скролл
            e.preventDefault();
            e.stopPropagation();
            // Скроллим внутренний контент
            updateScroll(deltaY);
        }
        // Если достигли верха или низа - позволяем скроллить родителя
        // (ничего не делаем, событие всплывает дальше)
        
    }, [scrollOffset, totalHeight, updateScroll]);

    // Вешаем обработчик на контейнер
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        container.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    const allRows = useMemo(() => {
        const rows = [];
        
        for (let rowIndex = bufferRange.start; rowIndex < bufferRange.end; rowIndex++) {
            const startItemIndex = rowIndex * size;
            const endItemIndex = Math.min(startItemIndex + size, data.length);
            const rowItems = data.slice(startItemIndex, endItemIndex);
            
            if (rowItems.length > 0) {
                const row = (
                    <div 
                        key={`row-${rowIndex}`} 
                        className={className ? className : `${s.merchField}`}
                        style={{ 
                            height: `${rowHeight}px`,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {rowItems.map(item => (
                            <MerchBlock 
                                key={item.id} 
                                width={`${100 / size}%`}
                                data={item} 
                            />
                        ))}
                    </div>
                );
                rows.push(row);
            }
        }
        
        return rows;
    }, [data, bufferRange, size, className, rowHeight]);

    return (
        <div 
            ref={containerRef}
            style={{ 
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative"
            }}
        >
            <div style={{
                height: `${totalHeight}px`,
                transform: `translateY(-${scrollOffset}px)`,
                transition: 'transform 0.1s ease-out'
            }}>
                <div style={{ height: `${bufferRange.start * rowHeight}px` }} />
                {allRows}
                <div style={{ 
                    height: `${Math.max(0, (totalRows - bufferRange.end) * rowHeight)}px` 
                }} />
            </div>
        </div>
    );
});

export default React.memo(MerchFieldWithScroll);