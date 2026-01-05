import React, { useRef, useState, useCallback, useEffect, CSSProperties,memo } from 'react'

type SliderProps = {
    callback?: (value: number) => void
    data: number
}

const wrapperStyle: CSSProperties = {
    position: "relative",
    height: "40px",
    margin: "10px",
    cursor: "pointer"
}

const Slider: React.FC<SliderProps> = React.memo(({ callback, data }) => {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const sliderRef = useRef<HTMLDivElement>(null)
    const isActive = useRef(false)
    const [sliderPosition, setSliderPosition] = useState(0)

    // Initialize slider position
    useEffect(() => {
        if (wrapperRef.current && data >= 0 && data <= 1) {
            setSliderPosition(wrapperRef.current.clientWidth * data)
        }
    }, [data]) // Added data as dependency

    const updateSliderPosition = useCallback((clientX: number) => {
        if (!wrapperRef.current) return
        
        const rect = wrapperRef.current.getBoundingClientRect()
        const pos = Math.min(Math.max(clientX - rect.left, 0), wrapperRef.current.clientWidth)
        setSliderPosition(pos)
        callback?.(pos / wrapperRef.current.clientWidth)
    }, [callback])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isActive.current) {
            updateSliderPosition(e.clientX)
        }
    }, [updateSliderPosition])

    const handleMouseDown = useCallback(() => {
        isActive.current = true
    }, [])

    const handleMouseUp = useCallback(() => {
        isActive.current = false
    }, [])

    const handleMouseLeave = useCallback(() => {
        isActive.current = false
    }, [])

    const sliderStyle: CSSProperties = {
        position: "absolute",
        left: `${sliderPosition - 5}px`,
        width: "10px",
        height: "10px",
        backgroundColor: "green",
        top: 0,
        bottom: 0,
        margin: "auto",
        cursor: "grab",
        zIndex: 2
    }

    const filledTrackStyle: CSSProperties = {
        height: "inherit",
        backgroundColor: "red",
        width: `${sliderPosition}px`,
        position: "absolute",
        zIndex: 1
    }

    return (
        <div
            ref={wrapperRef}
            style={wrapperStyle}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            <div style={filledTrackStyle} />
            <div 
                ref={sliderRef}
                style={sliderStyle}
                onMouseDown={handleMouseDown}
            />
        </div>
    )
})

export default memo(Slider)