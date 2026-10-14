import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { getAddressDeliveryData } from 'src/providers/cdek';
import DropDownList from '../../components/dropComponents/DropDownList';
import s from './style.module.css';
import InputWithLabelWithValidation from 'src/components/input/InputWithLabelWithValidation';

type AddressObject = {
    town?: string;
    index?: string;
    street?: string;
    coordinates?: [number, number];
    house?: string;
    value?: string;
    settlement?: string;
};

type PropsRowType = {
    onChange: (address: AddressObject | string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: {
        dropList: string;
        input: string;
    };
    placeholder?: string;
    val?: string;
    valid: boolean;
};

const AddressInput: React.FC<PropsRowType> = memo(({
    onChange,
    onFocus,
    onBlur,
    className,
    placeholder = 'Адрес',
    val = '',
    valid,
}) => {
    const [valState, setVal] = useState(val);
    const [activeList, setActive] = useState(false);
    const addressObjRef = useRef<AddressObject>({});
    const [dropDownListData, setDropDownList] = useState<React.ReactElement[]>([]);
    const suggestionsRef = useRef<any[]>([]);
    const timeoutId = useRef<NodeJS.Timeout | null>(null);
    const [validFlag, setValid] = useState(valid);

    const updateValidObj = useCallback(() => {
        const isValid = Boolean(
            addressObjRef.current.coordinates?.[0] &&
            addressObjRef.current.coordinates?.[1]
        );
        setValid(isValid);
    }, []);

    // 👇 Обновляем valState только при первом монтировании
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            setVal(val);
            isFirstRender.current = false;
        }
    }, [val]);

    useEffect(() => {
        return () => {
            if (timeoutId.current) clearTimeout(timeoutId.current);
        };
    }, []);

    useEffect(() => {
        setValid(valid);
    }, [valid]);

    // 👇 Выбор из списка — автоподстановка ТОЛЬКО здесь
    const handleAddressSelect = useCallback((suggestion: any) => {
        const { city, street, geo_lon, geo_lat, house, value, settlement, postal_code } = suggestion.data;

        addressObjRef.current = {
            town: city,
            street,
            coordinates: [Number(geo_lon), Number(geo_lat)],
            house,
            value: suggestion.value,
            settlement,
            index: postal_code,
        };

        setActive(false);
        setVal(suggestion.value);
        onChange(addressObjRef.current);
        updateValidObj();
    }, [onChange, updateValidObj]);

    const createSuggestionElements = useCallback((suggestions: any[]) => {
        return suggestions.map((suggestion, index) => (
            <div
                key={`${suggestion.value}-${index}`}
                onClick={() => handleAddressSelect(suggestion)}
                className={s.addressRow}
            >
                {suggestion.value}
            </div>
        ));
    }, [handleAddressSelect]);

    // 👇 Изменение input юзером — БЕЗ автоподстановки
    const handleInputChange = useCallback((inputVal: string) => {
        setVal(inputVal);
        if (timeoutId.current) clearTimeout(timeoutId.current);

        if (!inputVal || !inputVal.trim()) {
            setActive(false);
            onChange({});
            return;
        }

        timeoutId.current = setTimeout(() => {
            getAddressDeliveryData(inputVal, (data) => {
                suggestionsRef.current = data.suggestions;

                if (!data.suggestions.length) {
                    setActive(false);
                    return;
                }

                setDropDownList(createSuggestionElements(data.suggestions));
                setActive(true);
                // ❌ автоподстановки НЕТ
            });
        }, 500);
    }, [onChange, createSuggestionElements]);

    return (
        <div className={s.inputHolder}>
            <InputWithLabelWithValidation
                invalidText="Введите более точный адрес."
                valid={validFlag}
                val={valState}
                className={s.inputHolder}
                placeholder={placeholder}
                onFocus={onFocus}
                onBlur={onBlur}
                onChange={handleInputChange}
            />
            <DropDownList
                className={`${s.dropList} ${className?.dropList || ''}`}
                active={activeList}
            >
                {dropDownListData}
            </DropDownList>
        </div>
    );
});

export default AddressInput;