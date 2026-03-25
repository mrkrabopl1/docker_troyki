import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { getAddressDeliveryData } from 'src/providers/cdek';
import DropDownList from '../../components/dropComponents/DropDownList';
import s from './style.module.css';
import InputWithLabelWithValidation from 'src/components/input/InputWithLabelWithValidation';

type AddressObject = {
    town?: string;
    index?: string
    street?: string;
    coordinates?: [number, number];
    house?: string;
    value?: string
    settlement?:string
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
    valid: boolean
};

const AddressInput: React.FC<PropsRowType> = memo(({
    onChange,
    onFocus,
    onBlur,
    className,
    placeholder = "Адрес",
    val = "",
    valid
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

    useEffect(() => {
        getAddressDeliveryData(val, (data) => {
            suggestionsRef.current = data.suggestions;
            if (!data.suggestions.length) return
            setDropDownList(createSuggestionElements(data.suggestions));
            handleAddressSelect(data.suggestions[0])
        });
    }, [val]);

    useEffect(() => {
        return () => {
            timeoutId.current && clearTimeout(timeoutId.current);
        };
    }, []);

    useEffect(() => {
        setValid(valid)
    }, [valid]);


    const handleAddressSelect = useCallback((val: any) => {
        const { city, street, geo_lon, geo_lat, house, value,settlement,postal_code } = val.data;
        addressObjRef.current = {
            town: city,
            street,
            coordinates: [geo_lon, geo_lat],
            house,
            value:val.value,
            settlement,
            index:postal_code
        };
        setActive(false);
        onChange(addressObjRef.current);
        setVal(val.value);
        updateValidObj();
    }, [onChange, updateValidObj]);

   const handleAddress = useCallback((val: any) => {
        const { city, street, geo_lon, geo_lat, house, value,settlement,postal_code } = val.data;
        addressObjRef.current = {
            town: city,
            street,
            coordinates: [geo_lon, geo_lat],
            house,
            value,
            settlement,
            index:postal_code
        };
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

    const handleInputChange = useCallback((inputVal: string) => {
        setVal(inputVal);
        timeoutId.current && clearTimeout(timeoutId.current);

        if (inputVal && !inputVal.trim()) {
            setActive(false);
            onChange({});
            return;
        }

        timeoutId.current = setTimeout(() => {
            getAddressDeliveryData(inputVal, (data) => {
                suggestionsRef.current = data.suggestions;
                if (!data.suggestions.length) return
                setDropDownList(createSuggestionElements(data.suggestions));
                setActive(true);
                handleAddress(data.suggestions[0])
            });
        }, 500);
    }, [onChange, createSuggestionElements]);

    return (
        <div className={s.inputHolder}>
            <InputWithLabelWithValidation
                invalidText='Введите более точный адрес.'
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