import React, { ReactElement, useEffect, useRef, useState, memo, useCallback } from 'react'
import s from "./style.module.css"

let styleWrapper: any = {
    position: "relative",
    height: "40px"
}

type ZoneSliderSetterType = {
    min: number,
    max: number,
    onChange?: (...args: any) => void | null,
    memo?: boolean
}

const ZoneSliderSimple: React.FC<ZoneSliderSetterType> = ({ min, max, onChange }) => {

    let wrappRef = useRef<HTMLDivElement>(null)
    let sliderRefRight = useRef<HTMLDivElement>(null)
    let sliderRefLeft = useRef<HTMLDivElement>(null)
    let activeLeft = useRef(false)
    let activeRight = useRef(false)

    // ID активных касаний для мультитач
    let activeLeftTouchId = useRef<number | null>(null)
    let activeRightTouchId = useRef<number | null>(null)

    let sliderLeftData = useRef<number>(min)   // 0..1
    let sliderRightData = useRef<number>(max)  // 0..1

    let [sliderPositionLeft, setSliderPositionLeft] = useState(0)  // пиксели
    let [sliderPositionRight, setSliderPositionRight] = useState(1)

    // Рефы для актуальных пиксельных позиций, чтобы избежать stale-замыканий
    let sliderPositionLeftRef = useRef(sliderPositionLeft)
    let sliderPositionRightRef = useRef(sliderPositionRight)

    useEffect(() => {
        sliderPositionLeftRef.current = sliderPositionLeft
        sliderPositionRightRef.current = sliderPositionRight
    }, [sliderPositionLeft, sliderPositionRight])

    useEffect(() => {
        if (wrappRef.current) {
            if (sliderRefLeft.current && min >= 0 && min <= 1) {
                const wrapperWidth = wrappRef.current.clientWidth
                const sliderWidth = sliderRefLeft.current.clientWidth
                const availableWidth = wrapperWidth - sliderWidth
                const leftPos = Math.max(availableWidth * min, 0)
                setSliderPositionLeft(leftPos)
            }
            if (sliderRefRight.current && max >= 0 && max <= 1) {
                const wrapperWidth = wrappRef.current.clientWidth
                const sliderWidth = sliderRefRight.current.clientWidth
                const availableWidth = wrapperWidth - sliderWidth
                const rightPos = Math.max(availableWidth * max, 0)
                console.debug("update slider right", rightPos)
                setSliderPositionRight(rightPos)
            }
        }
    }, [min, max])

    // Функции обновления, используемые как мышью, так и touch
    const updateLeftFromClientX = useCallback((clientX: number) => {
        if (!wrappRef.current || !sliderRefLeft.current) return
        const wrapperRect = wrappRef.current.getBoundingClientRect()
        const sliderWidth = sliderRefLeft.current.clientWidth
        const wrapperWidth = wrapperRect.width
        const availableWidth = wrapperWidth - sliderWidth
        let pos = clientX - wrapperRect.left - sliderWidth / 2
        let leftPos = Math.max(Math.min(pos, availableWidth), 0)
        // Принудительно не пересекаем правый ползунок (используем ref для актуального значения)
        const right = sliderPositionRightRef.current
        if (leftPos >= right) {
            leftPos = right
        }
        setSliderPositionLeft(leftPos)
        sliderLeftData.current = leftPos / availableWidth
        if (leftPos >= right) {
            setSliderPositionRight(leftPos)
            sliderRightData.current = sliderLeftData.current
        }
        if (onChange) onChange(sliderLeftData.current, sliderRightData.current)
    }, [onChange])

    const updateRightFromClientX = useCallback((clientX: number) => {
        if (!wrappRef.current || !sliderRefRight.current) return
        const wrapperRect = wrappRef.current.getBoundingClientRect()
        const sliderWidth = sliderRefRight.current.clientWidth
        const wrapperWidth = wrapperRect.width
        const availableWidth = wrapperWidth - sliderWidth
        let pos = clientX - wrapperRect.left - sliderWidth / 2
        let rightPos = Math.max(Math.min(pos, availableWidth), 0)
        // Принудительно не пересекаем левый ползунок (используем ref для актуального значения)
        const left = sliderPositionLeftRef.current
        if (rightPos <= left) {
            rightPos = left
        }
        setSliderPositionRight(rightPos)
        sliderRightData.current = rightPos / availableWidth
        if (rightPos <= left) {
            setSliderPositionLeft(rightPos)
            sliderLeftData.current = sliderRightData.current
        }
        if (onChange) onChange(sliderLeftData.current, sliderRightData.current)
    }, [onChange])

    // ---------- Mouse handlers (исправлены, используют стабильные функции) ----------
    const handleMouseMove = useCallback((e: MouseEvent) => {
        e.preventDefault()
        if (activeLeft.current) updateLeftFromClientX(e.clientX)
        if (activeRight.current) updateRightFromClientX(e.clientX)
    }, [updateLeftFromClientX, updateRightFromClientX])

    const mouseDownLeft = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        activeLeft.current = true
        document.addEventListener("mouseup", () => {
            activeLeft.current = false
            document.removeEventListener("mousemove", handleMouseMove)
        }, { once: true })
        document.addEventListener("mousemove", handleMouseMove)
    }, [handleMouseMove])

    const mouseDownRight = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        activeRight.current = true
        document.addEventListener("mouseup", () => {
            activeRight.current = false
            document.removeEventListener("mousemove", handleMouseMove)
        }, { once: true })
        document.addEventListener("mousemove", handleMouseMove)
    }, [handleMouseMove])

    // ---------- Touch handlers ----------
    const handleLeftTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault()
        activeLeft.current = true
        activeLeftTouchId.current = e.changedTouches[0].identifier
    }, [])

    const handleRightTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault()
        activeRight.current = true
        activeRightTouchId.current = e.changedTouches[0].identifier
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault() // запрещаем скролл страницы
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i]
            if (touch.identifier === activeLeftTouchId.current) {
                updateLeftFromClientX(touch.clientX)
            } else if (touch.identifier === activeRightTouchId.current) {
                updateRightFromClientX(touch.clientX)
            }
        }
    }, [updateLeftFromClientX, updateRightFromClientX])

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i]
            if (touch.identifier === activeLeftTouchId.current) {
                activeLeft.current = false
                activeLeftTouchId.current = null
            }
            if (touch.identifier === activeRightTouchId.current) {
                activeRight.current = false
                activeRightTouchId.current = null
            }
        }
    }, [])

    const handleTouchCancel = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        handleTouchEnd(e)
    }, [handleTouchEnd])

    let sliderStyleLeft: any = {
        position: "absolute",
        left: sliderPositionLeft,
        top: 0,
        bottom: 0,
        margin: "auto"
    }

    let sliderStyleRight: any = {
        position: "absolute",
        left: sliderPositionRight,
        top: 0,
        bottom: 0,
        margin: "auto"
    }

    return (
        <div
            style={styleWrapper}
            ref={wrappRef}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
        >
            <div className={s.sliderLine} style={
                {
                    position: "absolute",
                    margin: "auto", top: 0, bottom: 0,
                    width: "100%"
                }}>
                <div
                    className={s.sliderControl}
                    onMouseDown={mouseDownLeft}
                    onTouchStart={handleLeftTouchStart}
                    ref={sliderRefLeft}
                    style={sliderStyleLeft}
                />
                <div
                    className={s.sliderControl}
                    onMouseDown={mouseDownRight}
                    onTouchStart={handleRightTouchStart}
                    ref={sliderRefRight}
                    style={sliderStyleRight}
                />
            </div>
        </div>
    )
}

function arePropsEqual(oldProps: ZoneSliderSetterType, newProps: ZoneSliderSetterType) {
    return oldProps.min === newProps.min && oldProps.max === newProps.max && oldProps.memo === newProps.memo;
}

export default memo(ZoneSliderSimple, arePropsEqual)