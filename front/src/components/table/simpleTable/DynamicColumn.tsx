import React, { useCallback, memo } from 'react';
import s from "./style.module.css";
import ColumnHeader from './ColumnHeader';
import DinamicElement from "src/components/dynamicElement/DynamicElement";

interface ElementDynamic {
    name: string;
    componentInfo: {
        componentName: string;
        propsData: any;
    };
    key?: string; // Добавлено для лучшего управления ключами
}

type ColumnProps = {
    form: ElementDynamic[];
    onChange?: (arg: {name: string, data: any}) => void;
    children?: React.ReactNode;
};

const DynamicColumnComponent: React.FC<ColumnProps> = ({ 
    form, 
    children, 
    onChange 
}) => {
    const handleChange = useCallback((name: string, data: any) => {
        onChange?.({ name, data });
    }, [onChange]);

    return (
        <div className={s.priceBlock}>
            <ColumnHeader>
                {children}
            </ColumnHeader>
            {form.map((val) => (
                <DinamicElement
                    key={val.name} // Используем name как ключ
                    onChange={(data) => handleChange(val.name, data)}
                    {...val.componentInfo}
                />
            ))}
        </div>
    );
};

export default memo(DynamicColumnComponent);