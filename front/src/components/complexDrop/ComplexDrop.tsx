import React, { useState, useRef, useCallback, useMemo } from 'react';
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
    const leftPos = useRef<number>(0);
    
    const [showDrop, setShowDrop] = useState(false);
    const [chosen, setChosen] = useState<string | null>(null);

    // Мемоизированная функция создания контента для основного меню
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
                    timeoutRef.current = setTimeout(() => setShowDrop(false), 100);
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

    // Мемоизированная функция создания выпадающего контента
    const createDropContent = useMemo(() => {
        if (!chosen || !data[chosen] || data[chosen].length <= 1) return null;
        
        return data[chosen].map(val => (
            <div 
                key={val} 
                onClick={() => onChange({ sub: val })}
                className={s.dropItem}
            >
                {val.toUpperCase()}
            </div>
        ));
    }, [chosen, data, onChange]);

    // Проверка, нужно ли показывать выпадающее меню
    const shouldShowDrop = chosen && data[chosen] && data[chosen].length > 1 && showDrop;

    return (
        <div className={s.complexDrop}>
            <ContentSliderWithSwitcherForShift content={createMainContent()} />
            {shouldShowDrop && (
                <div
                    onMouseEnter={() => {
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                        }
                    }}
                    onMouseLeave={() => setShowDrop(false)}
                    style={{ left: `${leftPos.current}px` }}
                    className={s.dropField}
                >
                    {createDropContent}
                </div>
            )}
        </div>
    );
};

export default React.memo(ComplexDrop);