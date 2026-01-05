import React, { memo, useCallback } from 'react';
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import CheckBoxColumn from 'src/components/checkBoxForm/CheckBoxForm';
import Scroller from 'src/components/scroller/Scroller';
import ZoneSliderValueSetter from 'src/modules/sliderValueSetter/ZoneSliderValueSetter';
import s from './style.module.css';

interface PriceProps {
    max: number;
    min: number;
    dataLeft?: number;
    dataRight?: number;
    onChange?: (arg: any) => void;
}
interface CheckBoxType {
    enable: boolean;
    activeData: boolean;
    name: string;
}
interface CheckboxProps {
    name: string;
    id: string,
    props: any;
}

interface ProductsFiltersProps {
    priceProps: PriceProps;
    checboxsProps: CheckboxProps[];
    soloDataProps: CheckBoxType[]
    memo?: boolean;
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
    soloDataProps
}) => {
    const handlePriceChange = useCallback((data: any) => {
        onChange?.({ id: "price", data });
    }, [onChange]);

    const handleCheckboxChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const handlSoloDataChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const renderCheckboxGroup = useCallback((checkboxProps: CheckboxProps) => (
        checkboxProps.props.length > 0 &&
        <div style={{ padding: "5px" }} key={checkboxProps.id}>
            <DoubleInfoDrop key={checkboxProps.name} info={checkboxProps.name}>
                <div style={{ height: "200px" }}>
                    <Scroller>
                        <CheckBoxColumn
                            onChange={(data) => handleCheckboxChange(checkboxProps.id, data)}
                            data={checkboxProps.props}
                        />
                    </Scroller>
                </div>
            </DoubleInfoDrop>
        </div>
    ), [handleCheckboxChange]);

    const renderSoloDataGroup = useCallback((soloDataProps) => (
        <CheckBoxColumn
            onChange={(data) => handlSoloDataChange(soloDataProps, data)}
            data={soloDataProps}
        />
    ), [handlSoloDataChange]);

    return (
        <div className={s.wrapper}>
            {soloDataProps && <div style={{ padding: "5px" }}>
                <CheckBoxColumn
                onChange={(data) => handlSoloDataChange("solo", data)}
                data={soloDataProps}
            />
                </div>}
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