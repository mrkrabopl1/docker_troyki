import React, { memo, useState, useCallback } from 'react';
import s from './style.module.css';
import Button from 'src/components/Button';
import PasswordInput from 'src/components/input/PasswordInput';
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation';
import { changeUserPass } from 'src/providers/userProvider';

interface ChangePasswordFormProps {
    className?: {
        input?: string;
        checkbox?: string;
        combobox?: string;
    };
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = memo(({ className }) => {
    const [passwords, setPasswords] = useState({
        oldPass: '',
        newPass: '',
        confirmPass: ''
    });

    const [errors, setErrors] = useState({
        oldPass: { isValid: true, message: '' },
        newPass: { isValid: true, message: '' }
    });

    const validatePassword = useCallback((password: string) => {
        if (password.length < 6) return 'Длина пароля должна быть больше 6 символов';
        return '';
    }, []);

    const validateForm = useCallback(() => {
        let isValid = true;
        const newErrors = {
            oldPass: { ...errors.oldPass },
            newPass: { ...errors.newPass }
        };

        // Validate new password
        if (passwords.newPass !== passwords.confirmPass) {
            newErrors.newPass = {
                isValid: false,
                message: 'Пароли не совпадают'
            };
            isValid = false;
        } else if (passwords.newPass.length < 6) {
            newErrors.newPass = {
                isValid: false,
                message: 'Пароль должен быть больше 6 символов'
            };
            isValid = false;
        } else if (passwords.newPass === passwords.oldPass) {
            newErrors.newPass = {
                isValid: false,
                message: 'Новый и старый пароли должны различаться'
            };
            isValid = false;
        } else {
            newErrors.newPass = { isValid: true, message: '' };
        }

        setErrors(newErrors);
        return isValid;
    }, [passwords, errors]);

    const handlePasswordChange = useCallback((field: keyof typeof passwords) => 
        (value: string) => {
            setPasswords(prev => ({ ...prev, [field]: value }));
        }, []);

    const handleSubmit = useCallback(() => {
        if (!validateForm()) return;

        const callback = (response: { err?: boolean }) => {
            if (response.err) {
                setErrors(prev => ({
                    ...prev,
                    oldPass: {
                        isValid: false,
                        message: 'Неверный старый пароль'
                    }
                }));
            } else {
                // Reset form on success
                setPasswords({
                    oldPass: '',
                    newPass: '',
                    confirmPass: ''
                });
                setErrors({
                    oldPass: { isValid: true, message: '' },
                    newPass: { isValid: true, message: '' }
                });
            }
        };

        changeUserPass({
            oldPass: passwords.oldPass,
            newPass: passwords.newPass
        }, callback);
    }, [passwords, validateForm]);

    return (
        <div onClick={(e) => e.stopPropagation()} className={s.wrapper}>
            <PasswordInputWithValidation 
                showToggle={false}
                valid={errors.oldPass.isValid}
                invalidText={errors.oldPass.message}
                onChange={handlePasswordChange('oldPass')}
                className={s.loginInput}
                placeholder="Старый пароль"
                value={passwords.oldPass}
            />
            
            <PasswordInputWithValidation 
                showToggle={true}
                validRule={validatePassword}
                valid={errors.newPass.isValid}
                invalidText={errors.newPass.message}
                onChange={handlePasswordChange('newPass')}
                className={s.loginInput}
                placeholder="Новый пароль"
                value={passwords.newPass}
            />
            
            <PasswordInput 
                check={true}
                onChange={handlePasswordChange('confirmPass')}
                className={s.loginInput}
                placeholder="Повторите пароль"
                val={passwords.confirmPass}
            />
            
            <Button 
                text='Сменить пароль'
                onClick={handleSubmit}
            />
        </div>
    );
});

export default ChangePasswordForm;