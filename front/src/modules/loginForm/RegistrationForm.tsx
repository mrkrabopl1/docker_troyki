import React, { useRef, useState } from 'react';
import s from "./style.module.css";
import Button from 'src/components/Button';
import PasswordInput from 'src/components/input/PasswordInput';
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import Link from 'next/link';

export interface RegisterFormData {
    mail: string;
    pass: string;
}

interface RegisterFormProps {
    className?: {
        input?: string;
        checkbox?: string;
        combobox?: string;
    };
    onRegister: (data: RegisterFormData) => void;
    isLoading?: boolean;
    error?: string | null;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
    className,
    onRegister,
    isLoading = false,
    error = null,
}) => {
    const validationObject = useRef<Record<string, boolean>>({});
    const passCheck = useRef<string>('');
    const formData = useRef<RegisterFormData>({
        mail: '',
        pass: '',
    });

    const [validRegister, setValidRegister] = useState<string>('');
    const [refresh, setRefresh] = useState<boolean>(false);

    const invalidPassText = useRef<string>('Пароли не совпадают');
    const invalidMailText = useRef<string>('Пустое поле ввода');

    const setFormData = (value: string, name: keyof RegisterFormData) => {
        formData.current[name] = value;
    };

    const validRuleForPass = (data: string) => {
        if (data.length < 6) {
            return 'Длина пароля должна быть больше 6 символов';
        }
        return undefined;
    };

    const updateValidObj = () => {
        setValidRegister('');
        const entries = Object.entries(formData.current);

        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];

            if (key === 'pass') {
                if (value !== passCheck.current) {
                    validationObject.current[key] = true;
                    invalidPassText.current = 'Пароли не совпадают';
                } else if (value.length < 6) {
                    validationObject.current[key] = true;
                    invalidPassText.current = 'Пароль должен быть больше 6 символов';
                } else {
                    delete validationObject.current[key];
                }
                continue;
            }

            if (key === 'mail') {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (re.test(value)) {
                    delete validationObject.current[key];
                } else {
                    validationObject.current[key] = true;
                    invalidMailText.current = 'Некорректный email';
                }
                continue;
            }

            if (value === '') {
                validationObject.current[key] = true;
            } else if (validationObject.current[key]) {
                delete validationObject.current[key];
            }
        }
    };

    const handleSubmit = () => {
        updateValidObj();

        if (Object.values(validationObject.current).length > 0) {
            setRefresh(!refresh);
            return;
        }

        onRegister({
            mail: formData.current.mail,
            pass: formData.current.pass,
        });
    };

    return (
        <div className={s.main} onClick={(e) => e.stopPropagation()}>
            <div className={s.caption}>Регистрация</div>

            <div>
                Продолжая, вы даете <Link href="/">согласие на обработку</Link>{' '}
                персональных данных.
            </div>

            <MailInputWithValidation
                valid={!validationObject.current.mail}
                invalidText={invalidMailText.current}
                onChange={(data) => setFormData(data, 'mail')}
                placeholder="Электронный адрес"
            />

            <PasswordInputWithValidation
                showToggle={true}
                validRule={validRuleForPass}
                valid={!validationObject.current.pass}
                invalidText={invalidPassText.current}
                onChange={(data) => setFormData(data, 'pass')}
                // className={s.loginInput}
                placeholder="Password"
            />

            <PasswordInput
                check={true}
                onChange={(data) => {
                    passCheck.current = data;
                }}
                // className={s.loginInput}
                placeholder="Repeat password"
            />

            <Button
                className={s.loginButton}
                onClick={handleSubmit}
                text={isLoading ? 'Загрузка...' : 'Sign up'}
                disabled={isLoading}
            />

            {(validRegister || error) && (
                <div className={s.registerError}>
                    {validRegister || error}
                </div>
            )}
        </div>
    );
};

export default RegisterForm;