import React, { memo, useCallback } from 'react';
import Checkbox from '../checkbox/Checkbox';

interface CheckBoxType {
    id: string | number;
    enable: boolean;
    activeData: boolean;
    name: string;
}

interface ColumnProps {
    data: CheckBoxType[];
    onChange?: (data: CheckBoxType[]) => void; // возвращает обновлённый массив
}

const CheckBoxColumn: React.FC<ColumnProps> = ({ data, onChange }) => {
    const handleChange = useCallback((itemId: string | number, active: boolean) => {
        const updatedData = data.map(item =>
            item.id === itemId ? { ...item, activeData: active } : item
        );
        onChange?.(updatedData);
    }, [data, onChange]);

    return (
        <div>
            {data.map((item) => (
                <div key={item.id} style={{ display: "flex", padding: "5px 0" }}>
                    <Checkbox
                        onChange={(active) => handleChange(item.id, active)}
                        enable={item.enable}
                        activeData={item.activeData}
                    />
                    <p style={{ paddingLeft: "5px" }}>{item.name}</p>
                </div>
            ))}
        </div>
    );
};

export default memo(CheckBoxColumn);