import React, { memo, useCallback } from 'react';
import s from './style.module.css';
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';

interface FilterItem {
    name: string;
    component: React.ReactElement;
}

interface SettingsModuleProps {
    filters: FilterItem[];
    memo?: boolean;
    onChange?: (arg: { name: string; data: any }) => void;
    classNames?: {
        secondPage?: string;
        mainForm?: string;
    };
}

const SettingsModule: React.FC<SettingsModuleProps> = memo(({ 
    filters, 
    onChange, 
    classNames 
}) => {
    const handleChange = useCallback((name: string, data: any) => {
        onChange?.({ name, data });
    }, [onChange]);

    const renderFilter = useCallback((filter: FilterItem) => {
        // Clone the element and add onChange prop
        const enhancedComponent = React.cloneElement(filter.component, {
            ...filter.component.props,
            onChange: (data: any) => handleChange(filter.name, data)
        });

        return (
            <DoubleInfoDrop key={filter.name} info={filter.name}>
                {enhancedComponent}
            </DoubleInfoDrop>
        );
    }, [handleChange]);

    return (
        <div className={s.wrapper}>
            {filters.map(renderFilter)}
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default SettingsModule;