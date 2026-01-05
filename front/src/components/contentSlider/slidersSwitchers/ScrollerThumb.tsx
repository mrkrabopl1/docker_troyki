import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./scrollerThumb.scss";

type ScrollerThumbProps = {
    callback: (scroll: number, proportional?: boolean) => void;
    kSize: number;
    kPos: number;
    wheelDelta?: number;
};

const ScrollerThumb: React.FC<ScrollerThumbProps> = ({
    callback,
    kSize,
    kPos,
    wheelDelta
}) => {
    const [thumbPos, setThumbPos] = useState(0);
    const [thumbSize, setThumbSize] = useState(0);
    
    const thumbWrapperRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const lastMousePosRef = useRef(0);
    const thumbTravelSpaceRef = useRef(0);
    const isDraggingRef = useRef(false); // Добавляем ref для отслеживания

    // Обновление размеров и позиции thumb
    useEffect(() => {
        const wrapper = thumbWrapperRef.current;
        if (!wrapper) return;
        
        const handleWheel = (e: WheelEvent) => e.preventDefault();
        wrapper.addEventListener("wheel", handleWheel);

        const newSize = Math.max(wrapper.clientWidth * kSize, 20);
        const maxPos = wrapper.clientWidth - newSize;
        const newPos = kPos * maxPos;
        
        setThumbSize(newSize);
        setThumbPos(Math.max(0, Math.min(newPos, maxPos)));
        thumbTravelSpaceRef.current = maxPos;
        
        return () => {
            wrapper.removeEventListener("wheel", handleWheel);
        };
    }, [kSize, kPos]);

    const handleMove = useCallback((e: MouseEvent) => {
        if (! isDraggingRef.current || !thumbWrapperRef.current) return;

        const wrapper = thumbWrapperRef.current;
        const deltaPixels = e.clientX - lastMousePosRef.current;
        const currentThumbPos = thumbPos + deltaPixels;
        const thumbTravelSpace = wrapper.clientWidth - thumbSize;

        lastMousePosRef.current = e.clientX;

        if (thumbTravelSpace <= 0) return;

        const newThumbPos = Math.max(0, Math.min(currentThumbPos, thumbTravelSpace));
        const proportion = newThumbPos / thumbTravelSpace;
        
        setThumbPos(newThumbPos);
        callback(proportion, true);

    }, [ thumbSize, thumbPos, callback]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
       
        isDraggingRef.current = true; // Устанавливаем флаг
        lastMousePosRef.current = e.clientX;

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    }, [handleMove]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        e.stopPropagation();

        isDraggingRef.current = false; // Сбрасываем флаг
        document.removeEventListener('mousemove', handleMove);
    }, [handleMove]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        const wrapper = thumbWrapperRef.current;
        if (!wrapper) return;

        const thumbTravelSpace = wrapper.clientWidth - thumbSize;
        if (thumbTravelSpace <= 0) return;

        let delta: number;
        if (wheelDelta) {
            delta = (e.deltaY > 0 ? 1 : -1) * (wheelDelta * thumbTravelSpace);
        } else {
            delta = e.deltaY;
        }

        const currentThumbPos = thumbPos + delta;
        const newThumbPos = Math.max(0, Math.min(currentThumbPos, thumbTravelSpace));
        const proportion = newThumbPos / thumbTravelSpace;
        
        setThumbPos(newThumbPos);
        callback(proportion, true);

    }, [callback, thumbSize, thumbPos, wheelDelta]);

    // Добавляем обработчик mouseup на wrapper
    const handleWrapperMouseUp = useCallback((e: React.MouseEvent) => {
        // Если был drag - блокируем событие
        if (isDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, []);

    useEffect(() => {
        if (isDraggingRef.current) {
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
            document.addEventListener('mousemove', handleMove);
        } else {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }

        return () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', handleMove);
        };
    }, [ handleMove]);

    const wrapperStyle = {
        width: "100%", 
        bottom: 0 
    };

    const thumbStyle = {
        width: `${thumbSize}px`,
        left: `${thumbPos}px`,
        transform: 'translateZ(0)'
    };

    return (
        <div 
            ref={thumbWrapperRef} 
            className={s.wrapper} 
            style={wrapperStyle} 
            onWheel={handleWheel}
            onMouseDown={(e) =>{ e.preventDefault();e.stopPropagation()}}
            onClick={(e) => e.stopPropagation()}
        >
            <div 
                className={s.thumb}
                ref={thumbRef}
                style={thumbStyle}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};

export default React.memo(ScrollerThumb);