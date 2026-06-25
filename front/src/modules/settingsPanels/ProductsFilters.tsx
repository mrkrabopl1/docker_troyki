import React, { memo, useCallback } from 'react';
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import CheckBoxColumn from 'src/components/checkBoxForm/CheckBoxForm';
import SearchableCheckboxColumn from 'src/modules/columnWithSerch/SearchableCheckboxColumn';
import ZoneSliderValueSetter from 'src/modules/sliderValueSetter/ZoneSliderValueSetter';
import DatePicker from 'src/components/input/DatePicker';
import s from './style.module.css';
import {CheckBoxType} from 'src/types/modules';

interface PriceProps {
    max: number;
    min: number;
    dataLeft?: number;
    dataRight?: number;
    onChange?: (arg: any) => void;
}

// Теперь props — это массив CheckBoxType с полем id
interface CheckboxProps {
    name: string;
    id: string;
    props: CheckBoxType[];
}

interface TimeProps {
    name: string;
    id: string;
    value: string;
}

interface ProductsFiltersProps {
    priceProps: PriceProps;
    checboxsProps: CheckboxProps[];
    soloDataProps: CheckBoxType[];
    timeProps?: TimeProps[];
    onChange?: (arg: { id: string; data: any }) => void;
    classNames?: {
        secondPage?: string;
        mainForm?: string;
    };
}

const ProductsFilters: React.FC<ProductsFiltersProps> = memo(({
    priceProps,
    onChange,
    checboxsProps,
    soloDataProps,
    timeProps,
}) => {
    const handlePriceChange = useCallback((data: any) => {
        onChange?.({ id: "price", data });
    }, [onChange]);

    const handleCheckboxChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data }); // data — массив id
    }, [onChange]);

    const handlSoloDataChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const handleTimeChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const renderCheckboxGroup = useCallback((checkboxProps: CheckboxProps) => (
        checkboxProps.props.length > 0 &&
        <div style={{ padding: "5px" }} key={checkboxProps.id}>
            <DoubleInfoDrop key={checkboxProps.name} info={checkboxProps.name}>
                <div style={{ maxHeight: "200px" }}>
                    <SearchableCheckboxColumn
                        onChange={(data) => handleCheckboxChange(checkboxProps.id, data)}
                        data={checkboxProps.props}
                    />
                </div>
            </DoubleInfoDrop>
        </div>
    ), [handleCheckboxChange]);

    const renderTimeGroup = useCallback((timeProps: TimeProps[]) => (
        timeProps && timeProps.length > 0 &&
        <div style={{ padding: "5px" }} key={0}>
            <div style={{ maxHeight: "200px" }}>
                {timeProps.map(tp => (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }} key={tp.id}>
                        <div style={{ fontSize: "16px", minWidth: "120px", flexShrink: 0 }}>{tp.name}</div>
                        <DatePicker
                            onChange={(data) => handleTimeChange(tp.id, data)}
                            value={tp.value}
                        />
                    </div>
                ))}
            </div>
        </div>
    ), [handleTimeChange]);

    return (
        <div onScroll={(e) => e.stopPropagation()} className={s.wrapper}>
            {soloDataProps && (
                <div style={{ padding: "5px" }}>
                    <CheckBoxColumn
                        onChange={(data) => handlSoloDataChange("solo", data)}
                        data={soloDataProps}
                    />
                </div>
            )}
            {renderTimeGroup(timeProps)}
            <div style={{ padding: "5px" }}>
                <DoubleInfoDrop info="Цена">
                    <ZoneSliderValueSetter
                        onChange={handlePriceChange}
                        {...priceProps}
                    />
                </DoubleInfoDrop>
            </div>
            {checboxsProps.map(renderCheckboxGroup)}
        </div>
    );
});

export default ProductsFilters;