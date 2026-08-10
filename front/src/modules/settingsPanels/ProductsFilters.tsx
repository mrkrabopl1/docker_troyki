import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import CheckBoxColumn from 'src/components/checkBoxForm/CheckBoxForm';
import SearchableCheckboxColumn from 'src/modules/columnWithSerch/SearchableCheckboxColumn';
import ZoneSliderValueSetter from 'src/modules/sliderValueSetter/ZoneSliderValueSetter';
import DatePicker from 'src/components/input/DatePicker';
import s from './style.module.css';
import { CheckBoxType } from 'src/types/modules';

interface PriceProps {
    max: number;
    min: number;
    dataLeft?: number;
    dataRight?: number;
    onChange?: (arg: any) => void;
}

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

interface VariationFilterGroup {
    id: string;
    name: string;
    options: VariationOption[];
}

interface VariationOption {
    id: string;
    name: string;
    props: CheckBoxType[];
}

interface ProductsFiltersProps {
    priceProps: PriceProps;
    variationGroups?: VariationFilterGroup[];
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
    variationGroups = [],
}) => {
    const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
    const isInitialized = useRef(false); // 🔥 Флаг для предотвращения бесконечного цикла

    // 🔥 ИСПРАВЛЕННЫЙ useEffect
    useEffect(() => {
        // Если уже инициализировали - выходим
        if (isInitialized.current) return;
        
        const initialSelected: Record<string, string> = {};
        variationGroups.forEach(group => {
            if (group.options.length > 0) {
                initialSelected[group.id] = group.options[0].id;
            }
        });
        setSelectedVariations(initialSelected);
        isInitialized.current = true;
    }, [variationGroups]); // Зависимость оставляем, но флаг защищает

    // 🔥 Если variationGroups обновились новыми данными - обновляем selection
    useEffect(() => {
        // Проверяем, появились ли новые группы
        const newSelected: Record<string, string> = {};
        let hasChanges = false;
        
        variationGroups.forEach(group => {
            if (group.options.length > 0) {
                const currentSelected = selectedVariations[group.id];
                // Если нет выбранной опции или она не существует - выбираем первую
                if (!currentSelected || !group.options.find(o => o.id === currentSelected)) {
                    newSelected[group.id] = group.options[0].id;
                    hasChanges = true;
                } else {
                    newSelected[group.id] = currentSelected;
                }
            }
        });

        if (hasChanges) {
            setSelectedVariations(prev => ({
                ...prev,
                ...newSelected
            }));
        }
    }, [variationGroups]); // Зависимость только от variationGroups

    const handlePriceChange = useCallback((data: any) => {
        onChange?.({ id: "price", data });
    }, [onChange]);

    const handleCheckboxChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const handlSoloDataChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const handleTimeChange = useCallback((id: string, data: any) => {
        onChange?.({ id, data });
    }, [onChange]);

    const handleVariationSelect = useCallback((groupId: string, optionId: string) => {
        setSelectedVariations(prev => ({
            ...prev,
            [groupId]: optionId
        }));

        onChange?.({
            id: `variation_${groupId}`,
            data: {
                selectedOptionId: optionId,
                groupId: groupId
            }
        });
    }, [onChange]);

    const handleVariationCheckboxChange = useCallback((groupId: string, optionId: string, data: any) => {
        onChange?.({
            id: `variation_checkbox_${groupId}`,
            data: {
                optionId: optionId,
                selectedCheckboxes: data,
                groupId: groupId
            }
        });
    }, [onChange]);

    const renderVariationGroup = useCallback((group: VariationFilterGroup) => {
        if (!group.options || group.options.length === 0) return null;

        const selectedOptionId = selectedVariations[group.id] || group.options[0]?.id;
        const selectedOption = group.options.find(o => o.id === selectedOptionId);

        return (
            <div key={group.id} style={{ padding: "5px", marginBottom: "10px" }}>
                <DoubleInfoDrop info={group.name}>
                    <div style={{ maxHeight: "400px"}}>
                        <div style={{ 
                            display: "flex", 
                            gap: "4px", 
                            marginBottom: "16px",
                            backgroundColor: "#f0f0f0",
                            padding: "4px",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0"
                        }}>
                            {group.options.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => handleVariationSelect(group.id, option.id)}
                                    style={{
                                        flex: 1,
                                        padding: "8px 16px",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: selectedOptionId === option.id ? "#007bff" : "transparent",
                                        color: selectedOptionId === option.id ? "white" : "#333",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: selectedOptionId === option.id ? "bold" : "normal",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {option.name}
                                </button>
                            ))}
                        </div>

                        {selectedOption && selectedOption.props.length > 0 && (
                            <div>
                                <div style={{ 
                                    fontSize: "13px", 
                                    color: "#888", 
                                    marginBottom: "8px",
                                    fontWeight: "bold"
                                }}>
                                    {selectedOption.name}:
                                </div>
                                <SearchableCheckboxColumn
                                    onChange={(data) => handleVariationCheckboxChange(
                                        group.id,
                                        selectedOptionId,
                                        data
                                    )}
                                    data={selectedOption.props}
                                />
                            </div>
                        )}
                        
                        {selectedOption && selectedOption.props.length === 0 && (
                            <div style={{ 
                                textAlign: "center", 
                                color: "#999", 
                                padding: "20px 0" 
                            }}>
                                Нет доступных чекбоксов для {selectedOption.name}
                            </div>
                        )}
                    </div>
                </DoubleInfoDrop>
            </div>
        );
    }, [selectedVariations, handleVariationSelect, handleVariationCheckboxChange]);

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

            {variationGroups.map(renderVariationGroup)}
        </div>
    );
});

ProductsFilters.displayName = 'ProductsFilters';

export default ProductsFilters;