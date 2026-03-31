import React, { memo, useEffect, useCallback, useState, useRef } from 'react';
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation";
import s from './style.module.css';
import EmailPhoneInput from 'src/components/input/EmailPhoneInput';

interface ContactFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    };
    onChange: (data: any) => void;
    onValid?: (isValid: boolean) => void;
    valid: boolean;
    formValue?: {
        name?: string;
        mail?: string;
        phone?: string;
    };
    memo: boolean;
    checkValid?: boolean;
}

const ContactForm: React.FC<ContactFormModuleInterface> = memo(({
    className,
    onChange,
    onValid,
    valid,
    formValue,
    memo,
    checkValid
}) => {
    const [formData, setFormData] = useState({
        name: formValue?.name || "",
        mail: formValue?.mail || "",
        phone: formValue?.phone || "",
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
    const firstUpdate = useRef(true);
    
    // Регулярные выражения
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PHONE_REGEX = /^[\d\+][\d\(\)\ -]{4,14}\d$/;

    // Валидация формы
    const validateForm = useCallback(() => {
        const errors: Record<string, boolean> = {};
        let hasErrors = false;

        // Валидация имени
        if (!formData.name?.trim()) {
            errors.name = true;
            hasErrors = true;
        }

        // Валидация контакта (email или телефон)
        const hasEmail = !!formData.mail?.trim();
        const hasPhone = !!formData.phone?.trim();
        const isEmailValid = hasEmail && EMAIL_REGEX.test(formData.mail);
        const isPhoneValid = hasPhone && PHONE_REGEX.test(formData.phone);
        
        const isContactValid = (hasEmail && isEmailValid) || (hasPhone && isPhoneValid);
        
        if (!isContactValid) {
            errors.contact = true;
            hasErrors = true;
        }

        setValidationErrors(errors);
        return !hasErrors;
    }, [formData.name, formData.mail, formData.phone]);

    // Эффект для валидации при изменении данных
    useEffect(() => {
        const isValid = validateForm();
        onValid?.(isValid);
    }, [formData, validateForm, onValid]);

    // Эффект для вызова onChange после первого рендера
    useEffect(() => {
        if (!firstUpdate.current) {
            onChange(formData);
        }
    }, [formData, onChange]);

    // Сброс флага первого рендера
    useEffect(() => {
        firstUpdate.current = false;
    }, []);

    // Обновление данных при изменении formValue
    useEffect(() => {
        if (formValue) {
            setFormData(prev => ({
                ...prev,
                ...(formValue.name !== undefined && { name: formValue.name }),
                ...(formValue.mail !== undefined && { mail: formValue.mail }),
                ...(formValue.phone !== undefined && { phone: formValue.phone })
            }));
        }
    }, [formValue]);

    const handleNameChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, name: value }));
    }, []);

    const handleContactChange = useCallback((data: { type: string; value: string }) => {
        if (data.type === "phone") {
            setFormData(prev => ({ ...prev, phone: data.value, mail: "" }));
        } else {
            setFormData(prev => ({ ...prev, mail: data.value, phone: "" }));
        }
    }, []);

    const getContactValue = useCallback(() => {
        return formData.mail || formData.phone;
    }, [formData.mail, formData.phone]);

    return (
        <div className={s.wrapper}>
            <div className={s.title}>Контактная информация</div>

            <InputWithLabelWithValidation
                val={formData.name}
                valid={!checkValid || !validationErrors.name}
                invalidText={"Введите ваше имя для связи с вами."}
                className={className?.input}
                onChange={handleNameChange}
                placeholder={"Имя"}
            />

            <EmailPhoneInput
                val={getContactValue()}
                valid={!checkValid || !validationErrors.contact}
                invalidText='Введите корректный email или телефон'
                className={s.formInput}
                onValid={() => {}} // EmailPhoneInput сам управляет валидацией
                placeholder='Введите email или телефон'
                onChange={handleContactChange}
            />
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default ContactForm;