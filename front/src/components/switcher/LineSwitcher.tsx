import React, { useRef, useState, useEffect, useCallback, CSSProperties, memo } from "react"

type SwitcherType = {
    onChange?: (isActive: boolean) => void,
    data: boolean
}

const wrapperStyle: CSSProperties = {
    width: "50px",
    height: "30px",
    border: "2px solid white",
    position: "relative",
    cursor: "pointer"
}

const blockStyle: CSSProperties = {
    position: "absolute",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "white",
    transition: "left 0.3s ease, background 0.3s ease, border 0.3s ease",
    zIndex: 2
}

const loadLineStyle: CSSProperties = {
    position: "absolute",
    width: "100%",
    margin: "auto",
    height: "20px",
    borderRadius: "10px",
    backgroundColor: "black",
    top: 0, 
    left: 0, 
    bottom: 0, 
    right: 0,
    transition: "background 0.3s ease"
}

const animate = (timing: (t: number) => number, draw: (progress: number) => void, duration: number) => {
    const start = performance.now();

    const frame = (time: number) => {
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        draw(timing(timeFraction));

        if (timeFraction < 1) {
            requestAnimationFrame(frame);
        }
    };

    requestAnimationFrame(frame);
};

const LineSwitcher: React.FC<SwitcherType> = ({ onChange, data }) => {
    const [isActive, setIsActive] = useState(data);
    const checkBoxRef = useRef<HTMLDivElement>(null);
    const loadLineRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Синхронизация с внешним состоянием
    useEffect(() => {
        setIsActive(data);
    }, [data]);

    const moveCheckbox = useCallback((progress: number) => {
        if (!checkBoxRef.current || !wrapperRef.current || !loadLineRef.current) return;

        const wrapperWidth = wrapperRef.current.clientWidth;
        const checkboxWidth = checkBoxRef.current.clientWidth;
        const diff = wrapperWidth - checkboxWidth;

        if (isActive) {
            loadLineRef.current.style.background = `linear-gradient(to left, black ${wrapperWidth * progress}px, white ${wrapperWidth * progress}px)`;
            checkBoxRef.current.style.left = `${diff - (diff * progress)}px`;
            checkBoxRef.current.style.background = `linear-gradient(to right, white ${checkboxWidth * progress}px, black ${checkboxWidth * progress}px)`;
            checkBoxRef.current.style.border = "2px solid black";
        } else {
            loadLineRef.current.style.background = `linear-gradient(to right, white ${checkboxWidth * progress}px, black ${checkboxWidth * progress}px)`;
            checkBoxRef.current.style.left = `${diff * progress}px`;
            checkBoxRef.current.style.background = `linear-gradient(to left, black ${wrapperWidth * progress}px, white ${wrapperWidth * progress}px)`;
            checkBoxRef.current.style.border = "2px solid white";
        }
    }, [isActive]);

    const handleClick = useCallback(() => {
        const newState = !isActive;
        setIsActive(newState);
        onChange?.(newState);
        animate(Math.sqrt, moveCheckbox, 300);
    }, [isActive, onChange, moveCheckbox]);

    return (
        <div 
            ref={wrapperRef} 
            style={wrapperStyle}
            onClick={handleClick}
            role="switch"
            aria-checked={isActive}
        >
            <div ref={loadLineRef} style={loadLineStyle} />
            <div 
                ref={checkBoxRef} 
                style={{
                    ...blockStyle,
                    left: isActive ? '20px' : '0px'
                }} 
            />
        </div>
    );
};

const arePropsEqual = (prevProps: SwitcherType, nextProps: SwitcherType) => {
    return prevProps.data === nextProps.data;
};

export default memo(LineSwitcher, arePropsEqual);