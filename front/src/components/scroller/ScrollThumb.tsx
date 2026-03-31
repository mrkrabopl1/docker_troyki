import React, { useRef, useState, useEffect, useCallback } from 'react';

type ScrollerThumbProps = {
    callback: (scroll: number, proportional?: boolean) => void;
    kSize: number;
    isVertical: boolean;
    kPos: number;
};

const ScrollerThumb: React.FC<ScrollerThumbProps> = ({
    callback,
    kSize,
    isVertical,
    kPos
}) => {
    const [thumbPos, setThumbPos] = useState(0);
    const [thumbSize, setThumbSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [localThumbPos, setLocalThumbPos] = useState<number | null>(null); // Локальная позиция во время drag
    
    const thumbWrapperRef = useRef<HTMLDivElement>(null);
    const dragStartPosRef = useRef(0);
    const dragStartThumbPosRef = useRef(0);
    
    // Обновление размеров и позиции thumb
    useEffect(() => {
        const wrapper = thumbWrapperRef.current;
        if (!wrapper) return;

        if (isVertical) {
            const newSize = Math.max(wrapper.clientHeight * kSize, 20);
            const maxPos = wrapper.clientHeight - newSize;
            const newPos = kPos * maxPos;
            setThumbSize(newSize);
            // Не обновляем позицию во время drag
            if (!isDragging) {
                setThumbPos(Math.max(0, Math.min(newPos, maxPos)));
            }
        } else {
            const newSize = Math.max(wrapper.clientWidth * kSize, 20);
            const maxPos = wrapper.clientWidth - newSize;
            const newPos = kPos * maxPos;
            setThumbSize(newSize);
            // Не обновляем позицию во время drag
            if (!isDragging) {
                setThumbPos(Math.max(0, Math.min(newPos, maxPos)));
            }
        }
    }, [kSize, kPos, isVertical, isDragging]);

    const handleDragMove = useCallback((clientPos: number) => {
        if (!isDragging || !thumbWrapperRef.current) return;

        const wrapper = thumbWrapperRef.current;
        const wrapperSize = isVertical ? wrapper.clientHeight : wrapper.clientWidth;
        const thumbTravelSpace = wrapperSize - thumbSize;
        
        if (thumbTravelSpace <= 0) return;
        
        const delta = clientPos - dragStartPosRef.current;
        let newThumbPos = dragStartThumbPosRef.current + delta;
        newThumbPos = Math.max(0, Math.min(newThumbPos, thumbTravelSpace));
        
        // Используем локальную позицию для отображения
        setLocalThumbPos(newThumbPos);
        
        const proportion = newThumbPos / thumbTravelSpace;
        callback(proportion, true);
    }, [isDragging, isVertical, thumbSize, callback]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const clientPos = isVertical ? e.clientY : e.clientX;
        handleDragMove(clientPos);
    }, [isVertical, handleDragMove]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();
        const clientPos = isVertical ? e.touches[0].clientY : e.touches[0].clientX;
        handleDragMove(clientPos);
    }, [isVertical, handleDragMove]);

    const handleDragStart = useCallback((clientPos: number) => {
        setIsDragging(true);
        dragStartPosRef.current = clientPos;
        dragStartThumbPosRef.current = thumbPos;
        setLocalThumbPos(thumbPos); // Инициализируем локальную позицию
    }, [thumbPos]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const clientPos = isVertical ? e.clientY : e.clientX;
        handleDragStart(clientPos);
    }, [isVertical, handleDragStart]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const clientPos = isVertical ? e.touches[0].clientY : e.touches[0].clientX;
        handleDragStart(clientPos);
    }, [isVertical, handleDragStart]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setLocalThumbPos(null); // Сбрасываем локальную позицию
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const delta = e.deltaY > 0 ? 30 : -30;
        callback(delta, false);
    }, [callback]);

    useEffect(() => {
        if (isDragging) {
            document.body.style.userSelect = 'none';
            document.body.style.cursor = isVertical ? 'ns-resize' : 'ew-resize';
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
        } else {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleDragEnd, isVertical]);

    // Используем локальную позицию во время drag, иначе из пропсов
    const displayThumbPos = localThumbPos !== null ? localThumbPos : thumbPos;

    const wrapperStyle = {
        zIndex: 10,
        backgroundColor: "transparent",
        display: "flex",
        position: "absolute" as const,
        ...(isVertical 
            ? { 
                width: "8px",
                height: "100%", 
                right: 0,
                top: 0,
                flexDirection: "column" as const
              }
            : { 
                width: "100%", 
                height: "8px",
                bottom: 0,
                left: 0
              })
    };

    const thumbStyle = {
        position: "absolute" as const,
        backgroundColor: isDragging ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.3)",
        borderRadius: "4px",
        cursor: isVertical ? 'ns-resize' : 'ew-resize',
        transition: isDragging ? "none" : "background-color 0.2s",
        willChange: isDragging ? "transform" : "auto",
        ...(isVertical
            ? {
                width: "100%",
                height: `${thumbSize}px`,
                top: `${displayThumbPos}px`
              }
            : {
                width: `${thumbSize}px`,
                height: "100%",
                left: `${displayThumbPos}px`
              })
    };

    return (
        <div style={wrapperStyle} onWheel={handleWheel}>
            <div ref={thumbWrapperRef} style={{ position: "relative", width: "100%", height: "100%" }}>
                <div 
                    style={thumbStyle}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                />
            </div>
        </div>
    );
};

export default React.memo(ScrollerThumb);