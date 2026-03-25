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
import InputArea from 'src/components/input/InputAreaWithLabel';

interface Address {
    town: string;
    region: string;
    index: string;
    street: string;
    house?: string;
    settlement?: string;
    flat?: string;
    value?: string;
}

interface FormData {
    name: string;
    secondName?: string;
    mail: string;
    address: Address | null;
    phone: string;
    deliveryComment?: string;
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
    checkValid?: boolean;
    memo: boolean;
}

const SendForm: React.FC<SendFormProps> = memo(({
    className,
    onChange,
    onValid,
    valid,
    formValue,
    checkValid,
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

    useEffect(() => {
        if (formValue) {
            setFormData(prev => ({ ...prev, ...formValue }));
            setUnvalidFormData(prev => ({ ...prev, secondName: formValue.secondName || "" }));
        }
    }, [formValue]);

    useEffect(() => {
        const errors: Record<string, boolean> = {};
        let hasErrors = false;

        (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
            if (!formData[key] && !unvalidFormData[key] === undefined) {
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
        onChange({ ...formData, save: value });
    }, [formData]);

    return (
        <div className={s.sendFormWrapper}>
            <div className={s.formSection}>
                <h3 className={s.sectionTitle}>Контактная информация</h3>
                
                <div className={s.formGrid}>
                    <div className={s.formField}>
                        <MailInputWithValidation 
                            value={formData.mail} 
                            valid={!checkValid || !validationErrors.mail} 
                            invalidText="Введите корректный email" 
                            onChange={(data) => handleChange('mail', data)} 
                            placeholder="Электронная почта" 
                        />
                    </div>
                    
                    <div className={s.formField}>
                        <PhoneInputWithValidation 
                            val={formData.phone} 
                            invalidIncorrect="Неверный формат телефона" 
                            invalidEmpty="Введите номер телефона" 
                            valid={!checkValid || !validationErrors.phone} 
                            className={className?.input} 
                            onChange={(data) => handleChange('phone', data)} 
                            placeholder="Телефон" 
                        />
                    </div>
                </div>
                
                <div className={s.checkboxRow}>
                    <Checkbox activeData={false} enable={true} onChange={() => {}} />
                    <span className={s.checkboxLabel}>Отправляйте мне новости и предложения</span>
                </div>
                
                <div className={s.formGrid}>
                    <div className={s.formField}>
                        <InputWithLabelWithValidation 
                            val={formData.name} 
                            valid={!checkValid || !validationErrors.name} 
                            invalidText="Введите имя" 
                            className={className?.input} 
                            onChange={(data) => handleChange('name', data)} 
                            placeholder="Имя" 
                        />
                    </div>
                    <div className={s.formField}>
                        <InputWithLabel 
                            val={formData.secondName} 
                            onChange={handleUnvalidChange} 
                            placeholder="Фамилия (необязательно)" 
                        />
                    </div>
                </div>

                <div className={s.formField}>
                    <AddressInput  
                        val={formData.address?.value || ""}
                        valid={!checkValid || !validationErrors.address} 
                        onChange={(data) => handleChange('address', data)}   
                    />
                </div>
                
                <div className={s.formField}>
                    <InputArea
                        val={formData.deliveryComment}
                        onChange={(data) => handleChange('deliveryComment', data)}
                        placeholder="Комментарий к доставке (необязательно)"
                        rows={3}
                        maxLength={500}
                    />
                </div>
                
                {verified && (
                    <div className={s.checkboxRow}>
                        <Checkbox 
                            activeData={false} 
                            enable={true} 
                            onChange={handleSaveDataChange} 
                        />
                        <span className={s.checkboxLabel}>Сохранить эту информацию на будущее</span>
                    </div>
                )}
            </div>
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default SendForm;