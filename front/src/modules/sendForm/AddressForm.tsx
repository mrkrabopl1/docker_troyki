import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation";
import InputWithLabel from "src/components/input/InputWithLabel";
import 'src/global.css';

interface AddressFormValues {
    town: string;
    region: string;
    index: string;
    street: string;
    house?: string;
    flat?: string;
}

interface AddressFormModuleProps {
    memo?: boolean;
    valid: boolean;
    onChange: (data: AddressFormValues | null) => void;
    className?: {
        input?: string;
    };
    formValue?: Partial<AddressFormValues>;
}

const AddressFormComponent: React.FC<AddressFormModuleProps> = ({
    onChange,
    valid,
    className = {},
    formValue = {}
}) => {
    // Refs for form data and validation
    const formData = useRef<AddressFormValues>({
        town: "",
        region: "",
        index: "",
        street: "",
        house: "",
        flat: ""
    });
    
    const validationErrors = useRef<Record<string, boolean>>({});
    const isValid = useRef<boolean>(false);
    const isFirstRender = useRef(true);

    // Initialize form with default values
    useEffect(() => {
        if (formValue) {
            formData.current = {
                ...formData.current,
                ...formValue
            };
        }
    }, [formValue]);

    // Update validation when 'valid' prop changes
    useEffect(() => {
        if (!isFirstRender.current) {
            updateValidation();
        }
        isFirstRender.current = false;
    }, [valid]);

    const updateValidation = useCallback(() => {
        const newErrors: Record<string, boolean> = {};
        let hasErrors = false;

        // Required fields
        const requiredFields: (keyof AddressFormValues)[] = ['town', 'region', 'index', 'street'];
        
        requiredFields.forEach(field => {
            if (!formData.current[field]) {
                newErrors[field] = true;
                hasErrors = true;
            } else if (validationErrors.current[field]) {
                delete validationErrors.current[field];
            }
        });

        validationErrors.current = newErrors;
        return !hasErrors;
    }, []);

    const handleFieldChange = useCallback((field: keyof AddressFormValues, value: string) => {
        formData.current[field] = value;
        
        const isFormValid = updateValidation();
        
        if (isFormValid) {
            onChange(formData.current);
            isValid.current = true;
        } else if (isValid.current) {
            onChange(null);
            isValid.current = false;
        }
    }, [onChange, updateValidation]);

    const handleOptionalFieldChange = useCallback((field: 'house' | 'flat', value: string) => {
        formData.current[field] = value;
        
        if (Object.keys(validationErrors.current).length === 0) {
            onChange({ ...formData.current });
            isValid.current = true;
        }
    }, [onChange]);

    return (
        <div>
            <div className="flex">
                <InputWithLabelWithValidation
                    val={formData.current.town}
                    valid={!validationErrors.current.town}
                    invalidText="Введите город."
                    className={className.input}
                    onChange={(data) => handleFieldChange('town', data)}
                    placeholder="Город"
                />
                <InputWithLabelWithValidation
                    val={formData.current.region}
                    valid={!validationErrors.current.region}
                    invalidText="Введите регион"
                    className={className.input}
                    onChange={(data) => handleFieldChange('region', data)}
                    placeholder="Регион"
                />
                <InputWithLabelWithValidation
                    val={formData.current.index}
                    valid={!validationErrors.current.index}
                    invalidText="Введите почтовый индекс."
                    className={className.input}
                    onChange={(data) => handleFieldChange('index', data)}
                    placeholder="Почтовый индекс"
                />
            </div>
            <div className="flex">
                <InputWithLabelWithValidation
                    val={formData.current.street}
                    valid={!validationErrors.current.street}
                    invalidText="Введите улицу."
                    className={className.input}
                    onChange={(data) => handleFieldChange('street', data)}
                    placeholder="Улица"
                />
                <InputWithLabel
                    val={formData.current.house || ''}
                    className={className.input}
                    onChange={(data) => handleOptionalFieldChange('house', data)}
                    placeholder="Дом"
                />
                <InputWithLabel
                    val={formData.current.flat || ''}
                    className={className.input}
                    onChange={(data) => handleOptionalFieldChange('flat', data)}
                    placeholder="Квартира"
                />
            </div>
        </div>
    );
};

export default memo(AddressFormComponent, (prevProps, nextProps) => {
    return prevProps.valid === nextProps.valid && prevProps.memo === nextProps.memo;
});