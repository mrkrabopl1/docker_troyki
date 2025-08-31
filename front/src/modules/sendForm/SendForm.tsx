import React, { memo, useEffect, useCallback, useState } from 'react';
import InputWithLabel from "src/components/input/InputWithLabel";
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation";
import PhoneInputWithValidation from "src/components/input/PhoneInputWithValidation";
import Checkbox from "src/components/checkbox/Checkbox";
import s from './style.module.css';
import Button from 'src/components/Button';
import { verified } from 'src/store/reducers/menuSlice';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import AddressInput from './AddressInput';

interface Address {
    town: string;
    region: string;
    index: string;
    street: string;
    house?: string;
    flat?: string;
}

interface FormData {
    name: string;
    secondName?: string;
    mail: string;
    address: Address | null;
    phone: string;
}

interface SendFormProps {
    className?: {
        input?: string;
        checkbox?: string;
        combobox?: string;
    };
    onChange: (data: FormData & { save?: boolean }) => void;
    onValid?: (isValid: boolean) => void;
    valid: boolean;
    formValue?: Partial<FormData>;
    memo: boolean;
}

const SendForm: React.FC<SendFormProps> = memo(({
    className,
    onChange,
    onValid,
    valid,
    formValue,
    memo
}) => {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        mail: "",
        address: null,
        phone: "",
        ...formValue
    });

    const [unvalidFormData, setUnvalidFormData] = useState({
        secondName: formValue?.secondName || ""
    });

    const [saveData, setSaveData] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

    // Initialize form with prop values
    useEffect(() => {
        if (formValue) {
            setFormData(prev => ({ ...prev, ...formValue }));
            setUnvalidFormData(prev => ({ ...prev, secondName: formValue.secondName || "" }));
        }
    }, [formValue]);

    // Update validation when form data changes
    useEffect(() => {
        const errors: Record<string, boolean> = {};
        let hasErrors = false;

        (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
            if (!formData[key]) {
                errors[key] = true;
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        onValid?.(!hasErrors);
    }, [formData, memo, onValid]);

    const handleChange = useCallback((field: keyof FormData, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            onChange({ ...newData, save: saveData });
            return newData;
        });
    }, [onChange, saveData]);

    const handleUnvalidChange = useCallback((value: string) => {
        setUnvalidFormData(prev => ({ ...prev, secondName: value }));
    }, []);

    const handleSaveDataChange = useCallback((value: boolean) => {
        setSaveData(value);
    }, []);

    return (
        <div className={s.wrapper}>
            <div>Контактная информация</div>
            <MailInputWithValidation 
                value={formData.mail} 
                valid={!validationErrors.mail} 
                invalidText="Пустое поле ввода" 
                onChange={(data) => handleChange('mail', data)} 
                placeholder="Электронный адрес" 
            />
            
            <div className='flex pdn'>
                <div style={{ marginTop: "auto", marginBottom: "auto", paddingRight: "5px" }}>
                    <Checkbox activeData={false} enable={true} onChange={() => {}} />
                </div>
                <div>Отправляйте мне новости и предложения</div>
            </div>
            
            <div className='flex'>
                <InputWithLabelWithValidation 
                    val={formData.name} 
                    valid={!validationErrors.name} 
                    invalidText="Введите имя." 
                    className={className?.input} 
                    onChange={(data) => handleChange('name', data)} 
                    placeholder="Имя" 
                />
                <InputWithLabel 
                    val={unvalidFormData.secondName} 
                    onChange={handleUnvalidChange} 
                    placeholder="Фамилия" 
                />
            </div>
            
            <AddressInput  
                valid={!validationErrors.address} 
                onChange={(data) => handleChange('address', data)}
            />
            
            <PhoneInputWithValidation 
                val={formData.phone} 
                invalidIncorrect="Неверный формат" 
                invalidEmpty="Введите телефон" 
                valid={!validationErrors.phone} 
                className={className?.input} 
                onChange={(data) => handleChange('phone', data)} 
                placeholder="Телефон" 
            />
            
            {verified && (
                <div className='flex pdn'>
                    <div style={{ marginTop: "auto", marginBottom: "auto", paddingRight: "5px" }}>
                        <Checkbox 
                            activeData={false} 
                            enable={true} 
                            onChange={handleSaveDataChange} 
                        />
                    </div>
                    <span>Сохранить эту информацию на будущее</span>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default SendForm;