import React, { useRef, useState, useCallback, useEffect, CSSProperties, memo } from 'react'
import s from "./style.module.css"

type ZoneSliderProps = {
    min: number,
    max: number,
    onChangeLeft?: (value: number) => void,
    onChangeRight?: (value: number) => void,
    memo?: boolean
}

const wrapperStyle: CSSProperties = {
    position: "relative",
    height: "40px",
    cursor: 'pointer'
}

const ZoneSliderComponent: React.FC<ZoneSliderProps> = ({ 
    min, 
    max, 
    onChangeLeft, 
    onChangeRight 
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const sliderRefRight = useRef<HTMLDivElement>(null)
    const sliderRefLeft = useRef<HTMLDivElement>(null)
    const isActiveLeft = useRef(false)
    const isActiveRight = useRef(false)
    
    const [sliderPositionLeft, setSliderPositionLeft] = useState(0)
    const [sliderPositionRight, setSliderPositionRight] = useState(1)

    // Инициализация позиций слайдеров
    useEffect(() => {
        if (!wrapperRef.current || !sliderRefLeft.current) return
        
        const wrapperWidth = wrapperRef.current.clientWidth
        const sliderWidth = sliderRefLeft.current.clientWidth
        const availableWidth = wrapperWidth - 2 * sliderWidth
        
        setSliderPositionLeft(availableWidth * min + sliderWidth)
        setSliderPositionRight(availableWidth * max + sliderWidth)
    }, [min, max])

    // Обработчик движения мыши
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        
        if (!wrapperRef.current || !sliderRefLeft.current) return
        
        const wrapperRect = wrapperRef.current.getBoundingClientRect()
        const sliderWidth = sliderRefLeft.current.clientWidth
        const availableWidth = wrapperRect.width - 2 * sliderWidth
        const mousePos = e.clientX - wrapperRect.left

        if (isActiveLeft.current) {
            const newLeft = Math.min(
                Math.max(mousePos - sliderWidth / 2, sliderWidth),
                sliderPositionRight
            )
            setSliderPositionLeft(newLeft)
            onChangeLeft?.((newLeft - sliderWidth) / availableWidth)
        }

        if (isActiveRight.current) {
            const newRight = Math.max(
                Math.min(mousePos - sliderWidth / 2, wrapperRect.width - sliderWidth),
                sliderPositionLeft
            )
            setSliderPositionRight(newRight)
            onChangeRight?.((newRight - sliderWidth) / availableWidth)
        }
    }, [onChangeLeft, onChangeRight, sliderPositionLeft, sliderPositionRight])

    // Обработчики событий мыши
    const handleMouseUp = useCallback(() => {
        isActiveLeft.current = false
        isActiveRight.current = false
    }, [])

    const handleMouseLeave = useCallback(() => {
        isActiveLeft.current = false
        isActiveRight.current = false
    }, [])

    const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        isActiveLeft.current = true
    }, [])

    const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        isActiveRight.current = true
    }, [])

    // Стили элементов
    const sliderStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        bottom: 0,
        margin: "auto",
        width: '10px',
        height: '10px',
        zIndex: 2
    }

    const sliderStyleLeft = {
        ...sliderStyle,
        left: '-10px'
    }

    const sliderStyleRight = {
        ...sliderStyle,
        right: '-10px'
    }

    const trackStyle: CSSProperties = {
        position: "relative",
        left: `${sliderPositionLeft}px`,
        height: "inherit",
        backgroundColor: "red",
        width: `${sliderPositionRight - sliderPositionLeft}px`
    }

    return (
        <div
            ref={wrapperRef}
            style={wrapperStyle}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            <div style={trackStyle}>
                <div 
                    className={s.sliderControl} 
                    onMouseDown={handleLeftMouseDown} 
                    ref={sliderRefLeft} 
                    style={sliderStyleLeft} 
                />
                <div 
                    className={s.sliderControl} 
                    onMouseDown={handleRightMouseDown} 
                    ref={sliderRefRight} 
                    style={sliderStyleRight} 
                />
            </div>
        </div>
    )
}

// Функция сравнения пропсов для memo
const arePropsEqual = (prevProps: ZoneSliderProps, nextProps: ZoneSliderProps) => {
    return prevProps.min === nextProps.min && 
           prevProps.max === nextProps.max &&
           prevProps.memo === nextProps.memo
}

export const ZoneSlider = memo(ZoneSliderComponent, arePropsEqual)