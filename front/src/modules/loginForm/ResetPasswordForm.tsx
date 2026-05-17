// modules/resetPasswordForm/ResetPasswordForm.tsx
import React, { useState, useRef, useCallback } from 'react';
import s from "./reset.module.css";
import Button from 'src/components/Button';
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation';

interface ResetPasswordFormProps {
    className?: {
        input?: string;
        container?: string;
    };
    title?: string;
    subtitle?: string;
    submitButtonText?: string;
    isLoading?: boolean;
    error?: string | null;
    requireOldPassword?: boolean; // Для смены пароля внутри админки
    onSubmit: (data: { password: string; oldPassword?: string }) => void;
    onBack?: () => void;
    validationRules?: {
        password?: (value: string) => string | null;
    };
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    className = {},
    title = 'Смена пароля',
    subtitle,
    submitButtonText = 'Сменить пароль',
    isLoading = false,
    error = null,
    requireOldPassword = false,
    onSubmit,
    onBack,
    validationRules = {}
}) => {
    const [formData, setFormData] = useState({
        oldPassword: '',
        password: '',
        confirmPassword: ''
    });
    
    const [validation, setValidation] = useState({
        oldPassword: true,
        password: true,
        confirmPassword: true
    });
    
    const [errors, setErrors] = useState({
        oldPassword: '',
        password: '',
        confirmPassword: ''
    });

    // Дефолтная валидация пароля
    const defaultPasswordValidation = (value: string): string | null => {
        if (!value) {
            return 'Пароль обязателен';
        }
        if (value.length < 6) {
            return 'Пароль должен быть не менее 6 символов';
        }
        return null;
    };

    const validatePassword = validationRules.password || defaultPasswordValidation;

    const handleFieldChange = useCallback((value: string, field: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Сбрасываем ошибку при вводе
        setValidation(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    }, []);

    const handlePasswordBlur = useCallback(() => {
        const error = validatePassword(formData.password);
        if (error) {
            setValidation(prev => ({ ...prev, password: false }));
            setErrors(prev => ({ ...prev, password: error }));
        }
        
        // Проверяем совпадение паролей
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            setValidation(prev => ({ ...prev, confirmPassword: false }));
            setErrors(prev => ({ ...prev, confirmPassword: 'Пароли не совпадают' }));
        }
    }, [formData.password, formData.confirmPassword, validatePassword]);

    const handleConfirmPasswordChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, confirmPassword: value }));
        
        if (value && value !== formData.password) {
            setValidation(prev => ({ ...prev, confirmPassword: false }));
            setErrors(prev => ({ ...prev, confirmPassword: 'Пароли не совпадают' }));
        } else {
            setValidation(prev => ({ ...prev, confirmPassword: true }));
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    }, [formData.password]);

    const handleSubmit = useCallback(() => {
        let isValid = true;
        const newValidation = { ...validation };
        const newErrors = { ...errors };

        // Проверяем старый пароль если нужно
        if (requireOldPassword && !formData.oldPassword) {
            newValidation.oldPassword = false;
            newErrors.oldPassword = 'Введите текущий пароль';
            isValid = false;
        }

        // Проверяем новый пароль
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            newValidation.password = false;
            newErrors.password = passwordError;
            isValid = false;
        }

        // Проверяем подтверждение
        if (formData.password !== formData.confirmPassword) {
            newValidation.confirmPassword = false;
            newErrors.confirmPassword = 'Пароли не совпадают';
            isValid = false;
        }

        setValidation(newValidation);
        setErrors(newErrors);

        if (isValid) {
            const submitData: any = { password: formData.password };
            if (requireOldPassword) {
                submitData.oldPassword = formData.oldPassword;
            }
            onSubmit(submitData);
        }
    }, [formData, requireOldPassword, onSubmit, validatePassword]);

    return (
        <div 
            onClick={(e) => e.stopPropagation()} 
            className={`${s.main} ${className.container || ''}`}
        >
            {title && <div className={s.caption}>{title}</div>}
            {subtitle && <div className={s.subtitle}>{subtitle}</div>}
            
            {error && (
                <div className={s.globalError}>
                    {error}
                </div>
            )}
            
            {requireOldPassword && (
                <PasswordInputWithValidation 
                    showToggle={true}
                    valid={validation.oldPassword}
                    invalidText={errors.oldPassword || 'Некорректный пароль'}
                    value={formData.oldPassword}
                    onChange={(data) => handleFieldChange(data, 'oldPassword')}
                    className={className.input}
                    placeholder="Текущий пароль"
                />
            )}
            
            <PasswordInputWithValidation 
                showToggle={true}
                valid={validation.password}
                invalidText={errors.password || 'Некорректный пароль'}
                value={formData.password}
                onChange={(data) => handleFieldChange(data, 'password')}
                onBlur={handlePasswordBlur}
                validRule={validatePassword}
                className={className.input}
                placeholder="Новый пароль"
            />
            
            <PasswordInputWithValidation 
                showToggle={false}
                valid={validation.confirmPassword}
                invalidText={errors.confirmPassword || 'Пароли не совпадают'}
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={className.input}
                placeholder="Подтвердите пароль"
            />
            
            <div className={s.actions}>
                <Button 
                    className={s.submitButton}
                    onClick={handleSubmit}
                    text={isLoading ? 'Смена...' : submitButtonText}
                    disabled={isLoading}
                />
                
                {onBack && (
                    <Button 
                        className={s.cancelButton}
                        onClick={onBack}
                        text="Отмена"
                    />
                )}
            </div>
        </div>
    );
};

export default ResetPasswordForm;