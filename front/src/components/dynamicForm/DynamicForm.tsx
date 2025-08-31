import React, { useCallback } from 'react';
import DinamicElement from "src/components/dynamicElement/DynamicElement";
import s from "./style.module.css";

interface ElementDynamic {
    name: string;
    componentInfo: {
        componentName: string;
        propsData: any;
    };
}

type DynamicFormType = {
    form: ElementDynamic[];
    onChange?: (arg: { name: string; data: any }) => void;
};

const DynamicForm: React.FC<DynamicFormType> = ({ form, onChange }) => {
    // Мемоизированный обработчик изменений
    const handleChange = useCallback((name: string, data: any) => {
        onChange?.({ name, data });
    }, [onChange]);

    return (
        <div className={s.formContainer}>
            {form.map((item) => (
                <div key={item.name} className={s.formItem}>
                    <p className={s.itemTitle}>{item.name}</p>
                    <DinamicElement 
                        onChange={(data) => handleChange(item.name, data)} 
                        {...item.componentInfo}
                    />
                </div>
            ))}
        </div>
    );
};

export default React.memo(DynamicForm);