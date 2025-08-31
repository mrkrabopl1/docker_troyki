import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import Checkbox from '../checkbox/Checkbox';

interface CheckBoxType {
    enable: boolean;
    activeData: boolean;
    name: string;
}

interface ColumnProps {
    data: CheckBoxType[];
    onChange?: (data: boolean[]) => void;
}

const CheckBoxColumn: React.FC<ColumnProps> = ({ data, onChange }) => {
    const dataRef = useRef<CheckBoxType[]>(data);
    const valRef = useRef<boolean[]>([]);
    const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Обновляем ref при изменении данных
    useEffect(() => {
        dataRef.current = data;
        valRef.current = data.map(item => item.activeData);
    }, [data]);

    const handleChange = useCallback((id: number, active: boolean) => {
        dataRef.current[id].activeData = active;
        valRef.current[id] = active;

        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }

        timeoutId.current = setTimeout(() => {
            onChange?.(valRef.current);
        }, 500);
    }, [onChange]);

    useEffect(() => {
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, []);

    return (
        <div style={{ paddingLeft: "5px" }}>
            {data.map((val, id) => (
                <div key={`${val.name}-${id}`} style={{ display: "flex" }}>
                    <Checkbox 
                        onChange={(active) => handleChange(id, active)} 
                        enable={val.enable} 
                        activeData={val.activeData} 
                    />
                    <p>{val.name}</p>
                </div>
            ))}
        </div>
    );
};

export default memo(CheckBoxColumn);