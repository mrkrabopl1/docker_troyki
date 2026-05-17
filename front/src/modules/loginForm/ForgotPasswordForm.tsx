// modules/forgotPasswordForm/ForgotPasswordForm.tsx
import React, { useState, useRef } from 'react';
import s from "./forgot.module.css";
import Button from 'src/components/Button';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';

interface ForgotPasswordFormProps {
    className?: {
        input?: string;
        container?: string;
    };
    title?: string;
    subtitle?: string;
    submitButtonText?: string;
    successMessage?: string;
    isLoading?: boolean;
    error?: string | null;
    onSubmit: (email: string) => void;
    onBack?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
    className = {},
    title = 'Восстановление пароля',
    subtitle = 'Введите email, и мы отправим вам ссылку для смены пароля',
    submitButtonText = 'Отправить',
    successMessage = 'Письмо с инструкциями отправлено на указанный email',
    isLoading = false,
    error = null,
    onSubmit,
    onBack
}) => {
    const [email, setEmail] = useState<string>('');
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [emailError, setEmailError] = useState<string>('');
    const [isEmailValid, setIsEmailValid] = useState<boolean>(true);

    const handleEmailChange = (value: string | null) => {
        setEmail(value || '');
        setIsEmailValid(value !== null);
        setEmailError(value ? '' : 'Некорректный email');
    };

    const handleSubmit = () => {
        if (!email || !isEmailValid) {
            setEmailError('Введите корректный email');
            setIsEmailValid(false);
            return;
        }

        onSubmit(email);
        setIsSuccess(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSuccess) {
            handleSubmit();
        }
    };

    if (isSuccess) {
        return (
            <div className={`${s.main} ${className.container || ''}`}>
                <div className={s.successMessage}>
                    <div className={s.successIcon}>✓</div>
                    <div className={s.caption}>Письмо отправлено</div>
                    <div className={s.subtitle}>{successMessage}</div>
                    <div className={s.emailSent}>{email}</div>
                </div>
                
                {onBack && (
                    <Button 
                        className={s.backButton}
                        onClick={onBack}
                        text="Вернуться к входу"
                    />
                )}
            </div>
        );
    }

    return (
        <div 
            onClick={(e) => e.stopPropagation()} 
            className={`${s.main} ${className.container || ''}`}
            onKeyDown={handleKeyDown}
        >
            {title && <div className={s.caption}>{title}</div>}
            {subtitle && <div className={s.subtitle}>{subtitle}</div>}
            
            {error && (
                <div className={s.globalError}>
                    {error}
                </div>
            )}
            
            <MailInputWithValidation 
                valid={isEmailValid}
                invalidText={emailError || 'Некорректный email'}
                value={email}
                onChange={handleEmailChange}
                placeholder="Электронный адрес"
                className={className.input}
            />
            
            <div className={s.actions}>
                <Button 
                    className={s.submitButton}
                    onClick={handleSubmit}
                    text={isLoading ? 'Отправка...' : submitButtonText}
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

export default ForgotPasswordForm;