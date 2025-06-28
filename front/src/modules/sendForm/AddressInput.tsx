import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { getAddressDeliveryData } from 'src/providers/cdek'
import DropDownList from '../../components/DropDownList'
import s from './style.module.css'
import InputWithLabelWithValidation from 'src/components/input/InputWithLabelWithValidation'

type AddressObject = {
    town?: string;
    street?: string;
    coordinates?: [number, number];
    house?: string;
};

type PropsRowType = {
    onChange: (address: any) => void;
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

const AddressInput: React.FC<PropsRowType> = (props) => {
    const {
        onChange,
        onFocus,
        onBlur,
        className,
        placeholder = "Адрес",
        val = "",
        valid
    } = props;

    const [valState, setVal] = useState<string>(val);
    const [activeList, setActive] = useState<boolean>(false);
    const addressObjRef = useRef<AddressObject>({});
    const [dropDownListData, setDropDownList] = useState<ReactElement[]>([]);
    const suggestionsRef = useRef<any[]>([]);
    const timeoutId = useRef<NodeJS.Timeout | null>(null);
    const [validFlag,setValid] = useState(valid);
    const isFirstRender = useRef(true);

    const updateValidObj = useCallback(() => {
       setValid(Boolean(
            addressObjRef.current.coordinates?.[0] && 
            addressObjRef.current.coordinates?.[1]
        ));
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        updateValidObj();
    }, [valid, updateValidObj]);

    const handleAddressSelect = useCallback((val: any) => {
        const data = val.data;
        addressObjRef.current = {
            town: data.city,
            street: data.street,
            coordinates: [data.geo_lon, data.geo_lat],
            house: data.house
        };
        setActive(false);
        onChange(addressObjRef.current);
        setVal(val.value);
        updateValidObj();
    }, [onChange, updateValidObj]);

    const handleInputChange = useCallback((val: string) => {
        setVal(val);

        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }

        if (val === "") {
            setActive(false);
            onChange(val);
            return;
        }

        timeoutId.current = setTimeout(() => {
            getAddressDeliveryData(val, (data) => {
                const suggestions = data.suggestions.map((suggestion, index) => (
                    <div 
                        key={`${suggestion.value}-${index}`}
                        onClick={() => handleAddressSelect(suggestion)}
                        className={s.addressRow}
                    >
                        {suggestion.value}
                    </div>
                ));

                suggestionsRef.current = data.suggestions;
                setDropDownList(suggestions);
                setActive(true);
                onChange(val);
            });
        }, 500);
    }, [onChange, handleAddressSelect]);

    return (
        <div style={{ width: "100%", position: "relative" }}>
            <InputWithLabelWithValidation
                invalidText='Введите более точный адрес.'
                valid={validFlag}
                val={valState}
                className={s.inputHolder}
                placeholder={placeholder}
                onFocus={(e) => onFocus?.(e.target.value)}
                onBlur={(e) => onBlur?.(e.target.value)}
                onChange={handleInputChange}
            />
            <div style={{ width: "100%", position: "relative" }}>
                <DropDownList 
                    className={`${s.dropList} ${className?.dropList || ''}`} 
                    active={activeList}
                >
                    {dropDownListData}
                </DropDownList>
            </div>
        </div>
    );
};

export default AddressInput;