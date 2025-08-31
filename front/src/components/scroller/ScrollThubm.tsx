import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./style.module.css";

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
    const [startPos, setStartPos] = useState(0);
    
    const thumbWrapperRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Обработчик перемещения thumb
    const handleMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !thumbRef.current || !thumbWrapperRef.current) return;

        const wrapper = thumbWrapperRef.current;
        const thumb = thumbRef.current;
        
        let delta: number;
        let maxScroll: number;

        if (isVertical) {
            maxScroll = wrapper.clientHeight - thumb.clientHeight;
            delta = (e.clientY - startPos) / maxScroll;
            setStartPos(e.clientY);
        } else {
            maxScroll = wrapper.clientWidth - thumb.clientWidth;
            delta = (e.clientX - startPos) / maxScroll;
            setStartPos(e.clientX);
        }

        callback(delta, true);
    }, [isDragging, startPos, isVertical, callback]);

    // Обработчик отпускания мыши
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
    }, [handleMove]);

    // Обработчик нажатия на thumb
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos(isVertical ? e.clientY : e.clientX);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    }, [handleMove, handleMouseUp, isVertical]);

    // Обработчик колеса мыши
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
        callback(e.deltaY > 0 ? -10 : 10);
    }, [callback]);

    // Обновление размеров и позиции thumb
    useEffect(() => {
        const wrapper = thumbWrapperRef.current;
        const thumb = thumbRef.current;
        
        if (!wrapper || !thumb) return;

        if (isVertical) {
            const newSize = wrapper.clientHeight * kSize;
            const newPos = kPos * (wrapper.clientHeight - newSize);
            setThumbSize(newSize);
            setThumbPos(newPos);
        } else {
            const newSize = wrapper.clientWidth * kSize;
            const newPos = kPos * (wrapper.clientWidth - newSize);
            setThumbSize(newSize);
            setThumbPos(newPos);
        }
    }, [kSize, kPos, isVertical]);

    // Очистка эффектов
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [handleMove, handleMouseUp]);

    // Стили
    const wrapperStyle = {
        zIndex: 10,
        overscrollBehavior: "none",
        backgroundColor: "transparent",
        display: "flex",
        marginRight: "1px",
        position: "absolute" as const,
        ...(isVertical 
            ? { 
                width: "3px", 
                height: "100%", 
                right: 0,
                flexDirection: "column" as const
              }
            : { 
                width: "100%", 
                height: "3px", 
                bottom: 0 
              })
    };

    const thumbStyle = {
        position: "absolute" as const,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        borderRadius: "3px",
        ...(isVertical
            ? {
                width: "100%",
                height: `${thumbSize}px`,
                top: `${thumbPos}px`
              }
            : {
                width: `${thumbSize}px`,
                height: "100%",
                left: `${thumbPos}px`
              })
    };

    const innerWrapperStyle = {
        position: "relative" as const,
        width: isVertical ? "3px" : "100%",
        height: isVertical ? "100%" : "3px"
    };

    return (
        <div 
            onScroll={e => e.preventDefault()}
            onWheel={handleWheel}
            style={wrapperStyle}
        >
            <div 
                ref={thumbWrapperRef}
                style={innerWrapperStyle}
                onWheel={e => e.preventDefault()}
            >
                <div 
                    className={s.thumb}
                    ref={thumbRef}
                    style={thumbStyle}
                    onMouseDown={handleMouseDown}
                />
            </div>
        </div>
    );
};

export default React.memo(ScrollerThumb);