import React, { useRef, useState, useCallback, useMemo } from 'react';
import s from "./style.module.css";
import { useAppDispatch } from 'src/store/hooks/redux';
import { complexDropSlice } from 'src/store/reducers/complexDropSlice';
import Scroller from '../scroller/Scroller';

interface DataInterface {
    [key: string]:  { main: string; subs: string[] };
}

type ChangeType = { main?: string; sub?: string };

interface PropsType {
    data: DataInterface;
    onChange: (data: ChangeType) => void;
}

const ComplexDropVertical: React.FC<PropsType> = ({ data, onChange }) => {
    const dispatch = useAppDispatch();
    const { setName, clear } = complexDropSlice.actions;
    
    const mainRef = useRef<HTMLDivElement>(null);
    const inputRefs = useRef<HTMLDivElement[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const leftPos = useRef<number>(0);
    const [chosen,setChosen] = useState<string>("");
    
    //const [showDrop, setShowDrop] = useState(false);

    // Обработчик клика по основному элементу
    const handleMainItemClick = useCallback((val: string, index: number) => {
        if (inputRefs.current[index]) {
            leftPos.current = inputRefs.current[index].offsetLeft;
        }
        setChosen(val);
    }, []);

    // Создание контента для основного меню
    const mainContent = useMemo(() => (
        Object.keys(data).map((val, index) => (
            <div
                key={val}
                onClick={() => handleMainItemClick(val, index)}
                ref={el => { if (el) inputRefs.current[index] = el; }}
                className={s.mainElem}
                onMouseEnter={() => timeoutRef.current && clearTimeout(timeoutRef.current)}
            >
                {val}
            </div>
        ))
    ), [data, handleMainItemClick]);

    // Создание контента для выпадающего меню
    const dropContent = useMemo(() => {
        if (!chosen || !data[chosen]) return null;
        
        return data[chosen].subs.map((val, index) => (
            <div 
                key={`${val}-${index}`}
                onClick={() => onChange({ sub: val })}
                className={s.dropItem}
            >
                {val}
            </div>
        ));
    }, [data, onChange,chosen]);

    // Стили для выпадающего меню
    const dropFieldClass = useMemo(() => (
        `${s.dropFieldVertical} ${chosen ? s.show : s.hide}`
    ), [chosen]);

    // Обработчик колеса мыши
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div 
            ref={mainRef} 
            className={s.complexDropVertical}
            onWheel={handleWheel}
        >
            <div style = {{zIndex: 201, width: "100%"}}>{mainContent}</div>

           <div
                    onMouseEnter={() => timeoutRef.current && clearTimeout(timeoutRef.current)}
                    className={dropFieldClass}
                >
                    <Scroller className={s.scrollStyle}>
                        <div 
                            onClick={() => setChosen("")} 
                            className={`flex ${s.backPointer}`}
                        >
                            {chosen}
                        </div>
                        <div>{dropContent}</div>
                    </Scroller>
                </div>
        </div>
    );
};

export default React.memo(ComplexDropVertical);