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

interface CheckboxProps {
    name: string;
    props: any;
}

interface SnickersSettingsProps {
    priceProps: PriceProps;
    checboxsProps: CheckboxProps[];
    memo?: boolean;
    onChange?: (arg: { name: string; data: any }) => void;
    classNames?: {
        secondPage?: string;
        mainForm?: string;
    };
}

const SnickersSettings: React.FC<SnickersSettingsProps> = memo(({ 
    priceProps, 
    onChange, 
    checboxsProps 
}) => {
    const handlePriceChange = useCallback((data: any) => {
        onChange?.({ name: "price", data });
    }, [onChange]);

    const handleCheckboxChange = useCallback((name: string, data: any) => {
        onChange?.({ name, data });
    }, [onChange]);

    const renderCheckboxGroup = useCallback((checkboxProps: CheckboxProps) => (
        <DoubleInfoDrop key={checkboxProps.name} info={checkboxProps.name}>
            <div style={{ height: "200px" }}>
                <Scroller>
                    <CheckBoxColumn 
                        onChange={(data) => handleCheckboxChange(checkboxProps.name, data)} 
                        data={checkboxProps.props} 
                    />
                </Scroller>
            </div>
        </DoubleInfoDrop>
    ), [handleCheckboxChange]);

    return (
        <div className={s.wrapper}>
            <DoubleInfoDrop info="price">
                <ZoneSliderValueSetter 
                    onChange={handlePriceChange} 
                    {...priceProps} 
                />
            </DoubleInfoDrop>
            
            {checboxsProps.map(renderCheckboxGroup)}
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default SnickersSettings;