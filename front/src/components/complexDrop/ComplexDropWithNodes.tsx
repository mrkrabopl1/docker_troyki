import React, { useState, useRef, useCallback, useMemo, ReactElement } from 'react';
import s from "./style.module.css";
import { useAppDispatch } from 'src/store/hooks/redux';
import { complexDropSlice } from 'src/store/reducers/complexDropSlice';
import ContentSliderWithSwitcherForShift from '../contentSlider/ContentSliderWithSwitcherForShift';

type DataInterface = {[key:string]:{
    main:ReactElement,
    subs:string[],
}}

type ChangeType = { main?: string; sub?: string };

interface PropsType {
    data: DataInterface;
    onChange: (data: ChangeType) => void;
}

const ComplexDropWithNodes: React.FC<PropsType> = ({ data, onChange }) => {
    const dispatch = useAppDispatch();
    const { setName, clear } = complexDropSlice.actions;
    
    const inputRefs = useRef<HTMLDivElement[]>([]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const leftPos = useRef<number>(0);
    const dropRef = useRef<HTMLDivElement>(null);
    
    const [showDrop, setShowDrop] = useState(false);
    const [chosen, setChosen] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<number>(0);

    // Вычисляем позицию дропа
    const calculateDropPosition = useCallback((index: number) => {
        if (!inputRefs.current[index]) return 0;
        
        const rect = inputRefs.current[index].getBoundingClientRect();
        const dropWidth = 280;
        const windowWidth = window.innerWidth;
        const padding = 16;
        const containerRect = inputRefs.current[index].closest?.('.complexDrop')?.getBoundingClientRect?.() || { left: 0 };
        
        // Позиция относительно контейнера
        let left = rect.left - (containerRect.left || 0);
        
        // Если не помещается справа
        if (left + dropWidth > windowWidth - padding) {
            left = windowWidth - dropWidth - padding - (containerRect.left || 0);
        }
        
        // Если не помещается слева
        if (left < padding) {
            left = padding;
        }
        
        return left;
    }, []);

    const createMainContent = useCallback(() => {
        return Object.entries(data).map((val, index) => (
            <div
                key={index}
                onClick={() => onChange({ main: val[0] })}
                ref={el => {
                    if (el) inputRefs.current[index] = el;
                }}
                className={s.mainElem}
                onMouseLeave={() => {
                    timeoutRef.current = setTimeout(() => setShowDrop(false), 200);
                }}
                onMouseEnter={() => {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }
                    if (inputRefs.current[index]) {
                        const pos = calculateDropPosition(index);
                        setDropPosition(pos);
                        leftPos.current = pos;
                    }
                    setChosen(val[0]);
                    setShowDrop(true);
                }}
            >
                {val[1].main}
            </div>
        ));
    }, [data, onChange, calculateDropPosition]);

    const createDropContent = useMemo(() => {
        if (!chosen || !data[chosen] || data[chosen].subs.length <= 1) return null;
        
        return data[chosen].subs.map(val => (
            <div 
                key={val} 
                onClick={() => onChange({ sub: val, main: chosen })}
                className={s.dropItem}
            >
                {val.toUpperCase()}
            </div>
        ));
    }, [chosen, data, onChange]);

    const shouldShowDrop = chosen && data[chosen] && data[chosen].subs.length > 1 && showDrop;

    return (
        <div className={s.complexDrop}>
            <ContentSliderWithSwitcherForShift 
                className={{holder: s.sliderHolder}} 
                content={createMainContent()} 
            />
            {shouldShowDrop && (
                <div
                    ref={dropRef}
                    onMouseEnter={() => {
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                        }
                    }}
                    onMouseLeave={() => {
                        timeoutRef.current = setTimeout(() => setShowDrop(false), 200);
                    }}
                    onWheel={(e) => {
                        e.stopPropagation();
                    }}
                    style={{ left: `${leftPos.current}px` }}
                    className={s.dropField}
                >
                    {createDropContent}
                </div>
            )}
        </div>
    );
};

export default React.memo(ComplexDropWithNodes);