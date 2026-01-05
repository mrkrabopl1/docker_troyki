import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import s from "./style.module.css";
import { useAppDispatch } from 'src/store/hooks/redux';
import { complexDropSlice } from 'src/store/reducers/complexDropSlice';
import ContentSliderWithSwitcherForShift from '../contentSlider/ContentSliderWithSwitcherForShift';

interface DataInterface {
    [key: string]: string[];
}

type ChangeType = { main?: string; sub?: string };

interface PropsType {
    data: DataInterface;
    onChange: (data: ChangeType) => void;
}

const ComplexDrop: React.FC<PropsType> = ({ data, onChange }) => {
    const dispatch = useAppDispatch();
    const { setName, clear } = complexDropSlice.actions;
    
    const inputRefs = useRef<HTMLDivElement[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dropFieldRef = useRef<HTMLDivElement>(null);
    const leftPos = useRef<number>(0);
    const [alignRight, setAlignRight] = useState(false);
    
    const [showDrop, setShowDrop] = useState(false);
    const [chosen, setChosen] = useState<string | null>(null);

    // Проверяем, нужно ли выравнивать по правому краю
    const checkAlignment = useCallback(() => {
        if (!dropFieldRef.current || !chosen) return;
        
        const dropRect = dropFieldRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Если выпадающее меню выходит за правый край экрана
        if (dropRect.right > viewportWidth - 20) {
            setAlignRight(true);
        } else {
            setAlignRight(false);
        }
    }, [chosen]);

    useEffect(() => {
        if (showDrop) {
            checkAlignment();
            // Добавляем обработчик ресайза
            window.addEventListener('resize', checkAlignment);
            return () => window.removeEventListener('resize', checkAlignment);
        }
    }, [showDrop, checkAlignment]);

    const createMainContent = useCallback(() => {
        return Object.keys(data).map((val, index) => (
            <div
                key={val}
                onClick={() => onChange({ main: val })}
                ref={el => {
                    if (el) inputRefs.current[index] = el;
                }}
                className={s.mainElem}
                onMouseLeave={() => {
                    setChosen(val);
                    timeoutRef.current = setTimeout(() => setShowDrop(false), 150);
                }}
                onMouseEnter={() => {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                    }
                    if (inputRefs.current[index]) {
                        leftPos.current = inputRefs.current[index].offsetLeft;
                    }
                    setChosen(val);
                    setShowDrop(true);
                }}
            >
                {val.toUpperCase()}
            </div>
        ));
    }, [data, onChange]);

    const createDropContent = useMemo(() => {
        if (!chosen || !data[chosen] || data[chosen].length <= 1) return null;
        
        return data[chosen].map(val => (
            <div 
                key={val} 
                onClick={() => {
                    onChange({ sub: val });
                    setShowDrop(false);
                }}
                className={s.dropItem}
            >
                {val.toUpperCase()}
            </div>
        ));
    }, [chosen, data, onChange]);

    const shouldShowDrop = chosen && data[chosen] && data[chosen].length > 1 && showDrop;

    return (
        <div className={s.complexDrop}>
            <ContentSliderWithSwitcherForShift 
                className={{holder: s.sliderHolder}} 
                content={createMainContent()} 
            />
            {shouldShowDrop && (
                <div
                    ref={dropFieldRef}
                    onMouseEnter={() => {
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                        }
                    }}
                    onMouseLeave={() => setShowDrop(false)}
                    style={{ left: alignRight ? 'auto' : `${leftPos.current}px`, right: alignRight ? '0' : 'auto' }}
                    className={`${s.dropField} ${alignRight ? s.rightAligned : ''}`}
                >
                    {createDropContent}
                </div>
            )}
        </div>
    );
};

export default React.memo(ComplexDrop);