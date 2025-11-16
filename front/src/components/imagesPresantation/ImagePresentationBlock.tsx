import React, { useState, memo, useCallback } from 'react';
import s from "./style.module.css";
import loop from "../../../public/zoom.svg";

type IconProps = {
    image: string;
    onClick?: () => void;
    onHover?: (imagePath: string) => void;
    onOut?: () => void;
};

const ImagePresentationBlock: React.FC<IconProps> = ({ 
    image, 
    onClick, 
    onHover, 
    onOut 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseOver = useCallback(() => {
        setIsHovered(true);
        onHover?.(image);
    }, [image, onHover]);

    const handleMouseOut = useCallback(() => {
        setIsHovered(false);
        onOut?.();
    }, [onOut]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onClick?.();
    }, [onClick]);

    const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div 
            onClick={handleClick}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            className={s.imageContainer}
            style={{ height: "100%" }}
            role="button"
            aria-label="Image presentation block"
        >
            <img 
                loading="lazy"
                onMouseDown={handleImageMouseDown}
                style={{ 
                    objectFit: "contain",
                    width: "100%", 
                    height: "100%" 
                }} 
                src={`/${image}`} 
                alt="Presented content" 
            />
        </div>
    );
};

export default memo(ImagePresentationBlock);