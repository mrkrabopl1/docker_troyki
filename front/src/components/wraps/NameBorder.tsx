import React, { ReactElement, RefObject, useRef, useState, memo } from 'react'
import s from "./style.module.css"

interface NameBorderProps {
    content: ReactElement;
    name: string;
    onClick?: () => void;
}

const NameBorder = React.forwardRef<HTMLDivElement, NameBorderProps>((props, ref) => {
    const { content, name, onClick } = props;
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.();
    };

    const isClickable = Boolean(onClick);

    return (
        <div 
            ref={ref} 
            onClick={handleClick}
            onMouseUp={(e)=>{
                e.preventDefault()
            }}
              onMouseDown={(e) => {
            e.stopPropagation(); // Блокируем всплытие mousedown
        }}
            className={`${s.nameBorder} ${isClickable ? s.clickable : ''}`}
        >
            <div  onMouseDown={e=>{
                e.stopPropagation()
            }} className={s.fieldset}>
                <legend className={s.legend}>
                    {name}
                </legend>
                {content}
            </div>
        </div>
    );
});

export default memo(NameBorder);