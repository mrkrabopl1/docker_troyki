// pages/admin/ForgotPassword/ForgotPassword.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from 'src/providers/adminAuth';
import ForgotPasswordForm from 'src/modules/loginForm/ForgotPasswordForm';
import s from './style.module.css';

const AdminForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (email: string) => {
        setIsLoading(true);
        setError(null);

        requestPasswordReset(email, (result) => {
            setIsLoading(false);
            
            if (!result) {
                setError('Ошибка отправки. Проверьте email или попробуйте позже.');
            }
        });
    };

    return (
        <div className={s.container}>
            <div className={s.card}>
                <ForgotPasswordForm
                    title="Восстановление пароля админа"
                    subtitle="Введите email, указанный при регистрации в админ-панели"
                    submitButtonText="Отправить инструкции"
                    successMessage="Инструкции по восстановлению пароля отправлены на указанный email"
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                    onBack={() => navigate('/admin/login')}
                />
            </div>
            
            <div className={s.background}>
                <div className={s.gradientOverlay} />
            </div>
        </div>
    );
};

export default AdminForgotPassword;