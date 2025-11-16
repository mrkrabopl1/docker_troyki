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
    console.log(kPos,"kPos")
    const [thumbPos, setThumbPos] = useState(0);
    const [thumbSize, setThumbSize] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    
    const thumbWrapperRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const lastMousePosRef = useRef(0); // храним последнюю позицию мыши
    // Обновление размеров и позиции thumb
    useEffect(() => {
        const wrapper = thumbWrapperRef.current;
        if (!wrapper) return;
 const handleWheel = (e: WheelEvent) => e.preventDefault();
        wrapper.addEventListener("wheel", handleWheel);

        if (isVertical) {
            const newSize = Math.max(wrapper.clientHeight * kSize, 20);
            const maxPos = wrapper.clientHeight - newSize;
            const newPos = kPos * maxPos;
            setThumbSize(newSize);
            setThumbPos(Math.max(0, Math.min(newPos, maxPos)));
        } else {
            const newSize = Math.max(wrapper.clientWidth * kSize, 20);
            const maxPos = wrapper.clientWidth - newSize;
            const newPos = kPos * maxPos;
            setThumbSize(newSize);
            setThumbPos(Math.max(0, Math.min(newPos, maxPos)));
        }
         return () => {
            wrapper.removeEventListener("wheel", handleWheel);
        };
    }, [kSize, kPos, isVertical]);

    // Обработчик перемещения thumb
const handleMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !thumbWrapperRef.current) return;

    const wrapper = thumbWrapperRef.current;
    const wrapperRect = wrapper.getBoundingClientRect();
    
    let mousePos: number;
    let wrapperStart: number;
    let wrapperSize: number;

    if (isVertical) {
        mousePos = e.clientY;
        wrapperStart = wrapperRect.top;
        wrapperSize = wrapperRect.height;
    } else {
        mousePos = e.clientX;
        wrapperStart = wrapperRect.left;
        wrapperSize = wrapperRect.width;
    }

    // Вычисляем позицию мыши относительно wrapper
    const relativeMousePos = mousePos - wrapperStart - (thumbSize / 2);

    // Доступное пространство для перемещения thumb
    const thumbTravelSpace = wrapperSize - thumbSize;

    if (thumbTravelSpace <= 0) return;

    // Ограничиваем позицию thumb в пределах доступного пространства
    const newThumbPos = Math.max(0, Math.min(relativeMousePos, thumbTravelSpace));
    
    // Вычисляем пропорцию от 0 до 1
    const proportion = newThumbPos / thumbTravelSpace;

    // Передаем абсолютную позицию скролла
    callback(proportion, true);

}, [isDragging, isVertical, thumbSize, callback]);
    // Обработчик нажатия на thumb
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(true);
        // Запоминаем начальную позицию мыши
        lastMousePosRef.current = isVertical ? e.clientY : e.clientX;

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
    }, [handleMove, isVertical]);

    // Обработчик отпускания мыши
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
    }, [handleMove]);

    // Обработчик колеса мыши
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Wheel использует тот же callback что и drag
        callback(e.deltaY, false);
    }, [callback]);

    // Эффекты для управления обработчиками
    useEffect(() => {
        if (isDragging) {
            document.body.style.userSelect = 'none';
            document.body.style.cursor = isVertical ? 'ns-resize' : 'ew-resize';
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
    }, [isDragging, handleMove, isVertical]);

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
                flexDirection: "column" as const
              }
            : { 
                width: "100%", 
                height: "8px",
                bottom: 0 
              })
    };

    const thumbStyle = {
        position: "absolute" as const,
        backgroundColor: isDragging ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.3)",
        borderRadius: "4px",
        cursor: isVertical ? 'ns-resize' : 'ew-resize',
        transition: "background-color 0.2s",
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

    return (
        <div style={wrapperStyle} onWheel={handleWheel}>
            <div ref={thumbWrapperRef} style={{ position: "relative", width: "100%", height: "100%" }}>
                <div 
                    ref={thumbRef}
                    style={thumbStyle}
                    onMouseDown={handleMouseDown}
                />
            </div>
        </div>
    );
};

export default React.memo(ScrollerThumb);