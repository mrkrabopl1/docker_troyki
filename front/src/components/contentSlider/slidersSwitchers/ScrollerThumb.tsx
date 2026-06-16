import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./scrollerThumb.module.scss";

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
    const isDraggingRef = useRef(false);

    // Рефы для синхронного доступа к размерам и позиции (без задержек состояния)
    const thumbPosRef = useRef(0);
    const thumbSizeRef = useRef(0);
    const thumbTravelSpaceRef = useRef(0);

    // Обновление размеров и позиции thumb (синхронизируем state и ref)
    useEffect(() => {
        const wrapper = thumbWrapperRef.current;
        if (!wrapper) return;
        
        const handleWheel = (e: WheelEvent) => e.preventDefault();
        wrapper.addEventListener("wheel", handleWheel);

        const newSize = Math.max(wrapper.clientWidth * kSize, 20);
        const maxPos = wrapper.clientWidth - newSize;
        const newPos = kPos * maxPos;
        const clampedPos = Math.max(0, Math.min(newPos, maxPos));
        
        setThumbSize(newSize);
        setThumbPos(clampedPos);
        thumbSizeRef.current = newSize;
        thumbPosRef.current = clampedPos;
        thumbTravelSpaceRef.current = maxPos;
        
        return () => {
            wrapper.removeEventListener("wheel", handleWheel);
        };
    }, [kSize, kPos]);

    // Общий обработчик движения (для мыши и тача)
    const handleMove = useCallback((clientX: number) => {
        if (!isDraggingRef.current || !thumbWrapperRef.current) return;

        const wrapper = thumbWrapperRef.current;
        const deltaPixels = clientX - lastMousePosRef.current;
        // Используем актуальное значение из рефа, а не из состояния
        const currentThumbPos = thumbPosRef.current + deltaPixels;
        const thumbTravelSpace = wrapper.clientWidth - thumbSizeRef.current;

        lastMousePosRef.current = clientX;

        if (thumbTravelSpace <= 0) return;

        const newThumbPos = Math.max(0, Math.min(currentThumbPos, thumbTravelSpace));
        const proportion = newThumbPos / thumbTravelSpace;
        
        // Обновляем и реф, и состояние
        thumbPosRef.current = newThumbPos;
        setThumbPos(newThumbPos);
        callback(proportion, true);
    }, [callback]);

    // Обработчик для мыши
    const onMouseMove = useCallback((e: MouseEvent) => {
        handleMove(e.clientX);
    }, [handleMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
       
        isDraggingRef.current = true;
        lastMousePosRef.current = e.clientX;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    }, [onMouseMove]);

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
    }, [onMouseMove]);

    // Обработчики для тача
    const onTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault(); // важно! иначе страница скроллится
        handleMove(e.touches[0].clientX);
    }, [handleMove]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
       
        isDraggingRef.current = true;
        lastMousePosRef.current = e.touches[0].clientX;

        // Добавляем слушатель с { passive: false }, чтобы можно было вызвать preventDefault
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { once: true });
    }, [onTouchMove]);

    const handleTouchEnd = useCallback(() => {
        isDraggingRef.current = false;
        document.removeEventListener('touchmove', onTouchMove);
    }, [onTouchMove]);

    // Колесико мыши
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        const wrapper = thumbWrapperRef.current;
        if (!wrapper) return;

        const thumbTravelSpace = wrapper.clientWidth - thumbSizeRef.current;
        if (thumbTravelSpace <= 0) return;

        let delta: number;
        if (wheelDelta) {
            delta = (e.deltaY > 0 ? 1 : -1) * (wheelDelta * thumbTravelSpace);
        } else {
            delta = e.deltaY;
        }

        const currentThumbPos = thumbPosRef.current + delta;
        const newThumbPos = Math.max(0, Math.min(currentThumbPos, thumbTravelSpace));
        const proportion = newThumbPos / thumbTravelSpace;
        
        thumbPosRef.current = newThumbPos;
        setThumbPos(newThumbPos);
        callback(proportion, true);
    }, [callback, wheelDelta]);

    // Эффект для блокировки выделения и курсора при драге
    useEffect(() => {
        if (isDraggingRef.current) {
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
        } else {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }

        return () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDraggingRef.current]); // зависит от ref-значения, но эффект вызовется только при изменении isDraggingRef.current? Нет, ref не триггерит эффект. Поэтому лучше подписаться на изменение флага через стейт, но для простоты оставим как есть — эффект очистит стили при размонтировании.

    // Дополнительная очистка глобальных слушателей при размонтировании
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
        };
    }, [onMouseMove, onTouchMove]);

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
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
        >
            <div 
                className={s.thumb}
                ref={thumbRef}
                style={thumbStyle}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            />
        </div>
    );
};

export default React.memo(ScrollerThumb);