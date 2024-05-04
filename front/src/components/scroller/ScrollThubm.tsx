import React, { ReactElement, useEffect, useRef, useState } from 'react'

type propsScrollerThumbType = {
    callback: (scroll: any, prop?: boolean) => void,
    kSize: number,
    isVertical: boolean,
    kPos: number
}

let styleWrapper: any = {
    overflow: "hidden",
    position: "relative",
    height: "440px",
    width: "200px"
}




const ScrollerThumb: React.FC<propsScrollerThumbType> = (props) => {
    let { callback, kSize, kPos, isVertical } = { ...props }
    let [thumbPos, setThumbPos] = useState(kPos)
    let [moveThumb, setMoveThumb] = useState(false)
    let [moveEvent, setMoveEvent] = useState<any>(null)
    let [thumbSize, setThumbSize] = useState(0)
    let [startPos, setStartPos] = useState(0)
    let thumbWrapper = useRef<HTMLDivElement>(null)
    let intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    let thumb = useRef<HTMLDivElement>(null)
    let [contTop, setContTop] = useState(0)
    let [contLeft, setContLeft] = useState(0)
    let [horizontal, setHorizontal] = useState(false)
    let [vertical, setVertical] = useState(false)
    let scroller = useRef<HTMLDivElement>(null)
    let scrollCont = useRef<HTMLDivElement>(null)


    useEffect(() => {
        document.addEventListener("mouseup", (e) => {
            document.removeEventListener("mousemove", moveDraw)
            setMoveThumb(false)
        }
        )
        document.addEventListener("mousemove", moveDraw)
        if (thumbWrapper.current && thumb.current) {
            if (isVertical) {
                setThumbSize(thumbWrapper.current.clientHeight * kSize)
                setThumbPos(kPos * (thumbWrapper.current.clientHeight - thumb.current.clientHeight))
            } else {
                setThumbSize(thumbWrapper.current.clientWidth * kSize)
                setThumbPos(kPos * (thumbWrapper.current.clientWidth - thumb.current.clientWidth))
            }
        }
        return (): void => {
            document.removeEventListener("mousemove", moveDraw)
            document.removeEventListener("mouseup", (e) => {
                document.removeEventListener("mousemove", moveDraw)
                setMoveThumb(false)
            }
            )
        }
    }, [props])

    const startCounter = () => {
        if (intervalRef.current) return;
        let interval = 0
        intervalRef.current = setInterval(() => {
            interval = interval + 0.01
         callback(interval,true)
        }, 10);
      };
    
      const stopCounter = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    const styleScroller: any = {
        zIndex: 10,

        backgroundColor: "green",
        display: " flex",

    }

    const buttonStyle = {
        backgroundColor: "red",
        width: "100%",
        height: "20px"

    }



    let thumbWrapVericalStyle = {
        width: "20px",
        height: "100%"
    }

    let thumbWrapHorizontalStyle = {
        width: "100%",
        height: "20px"
    }


    let thumbVericalStyle = {
        width: "100%",
        height: thumbSize + "px",
        top: thumbPos + "px"
    }

    let thumbHorizontalStyle = {
        width: thumbSize + "px",
        height: "100%",
        left: thumbPos + "px"
    }

    let thumbStyle: any = {
        position: "absolute",
        backgroundColor: "yellow"
    }

    if (isVertical) {
        Object.assign(thumbStyle, thumbVericalStyle)
        Object.assign(styleScroller, thumbWrapVericalStyle)
        styleScroller.position = "absolute"
        styleScroller.right = 0
        styleScroller.flexDirection = "column"
    } else {
        Object.assign(thumbStyle, thumbHorizontalStyle)
        Object.assign(styleScroller, thumbWrapHorizontalStyle)
        styleScroller.position = "absolute"
        styleScroller.bottom = 0
    }

    let wrapThumbStyle: any = {
        position: "relative",
        width: "auto",
        height: "auto"

    }

    if (isVertical) {
        Object.assign(wrapThumbStyle, thumbWrapVericalStyle)
    } else {
        Object.assign(wrapThumbStyle, thumbWrapHorizontalStyle)
    }

    const styleContent: any = {
        position: "absolute",
        top: contTop + "px",
        left: contLeft + "px"

    }

    const moveDraw = (e: any) => {
        if (thumb.current && thumbWrapper.current) {

            if (moveThumb) {
                let delta
                if (isVertical) {
                    let maxScroll = thumbWrapper.current?.clientHeight - thumb.current?.clientHeight
                    delta = (e.clientY - startPos) / maxScroll
                    setStartPos(e.clientY)
                } else {
                    let maxScroll = thumbWrapper.current?.clientWidth - thumb.current?.clientWidth
                    delta = (e.clientX - startPos) / maxScroll
                    setStartPos(e.clientX)
                }
                callback(delta, true)
            }
        }
    }

    return (
        <div onWheel={(e) => {
            e.stopPropagation()
            let delta = e.deltaY > 0 ? -10 : 10
            callback(delta)
        }}
            id={"Thumb"} ref={scroller} style={styleScroller}>
            <button

                onMouseDown={(e)=>{
                    let interval = 0
                    intervalRef.current = setInterval(() => {
                        interval = interval - 0.01
                    callback(interval,true)
                    }, 10);
                }
                }
                onMouseUp={() => {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    
                }}
                style={buttonStyle}></button>
            <div ref={thumbWrapper} style={wrapThumbStyle}>
                <div onMouseUp={() => {
                    setMoveThumb(false)
                }}
                    onMouseDown={(e) => {
                        if (isVertical) {
                            setStartPos(e.clientY);
                        } else {
                            setStartPos(e.clientX);
                        }

                        setMoveThumb(true)
                    }
                    }
                    onMouseMove={
                        moveDraw
                    } ref={thumb} style={thumbStyle}></div>
            </div>
            <button
                onMouseDown={(e)=>{
                    let interval = 0
                    intervalRef.current = setInterval(() => {
                        interval = interval + 0.01
                     callback(interval,true)
                    }, 10);
                }
                }
                onMouseUp={()=>{
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }}
                style={buttonStyle}></button>
        </div>
    )
}


export default ScrollerThumb