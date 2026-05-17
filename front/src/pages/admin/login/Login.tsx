// pages/admin/Login/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginAdmin } from 'src/providers/adminAuth';
import LoginForm from 'src/modules/loginForm/LoginForm';
import s from './style.module.css';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectTo = searchParams.get('redirect') || '/admin/dashboard';

    const handleSubmit = async (data: { email: string; password: string; remember?: boolean }) => {
        setIsLoading(true);
        setError(null);

        loginAdmin({
            email: data.email,
            password: data.password,
            remember: data.remember || false
        }, (result) => {
            if (result) {
                console.log('User logged in:', result);
                navigate(redirectTo, { replace: true });
            }
        });
    }

    const handleForgotPassword = () => {
        navigate('/admin/forgot-password');
    };

    const handleChange = (data: Partial<{ email: string; password: string }>) => {
        // Сбрасываем ошибку при изменении полей
        if (error) setError(null);
        console.debug('Form changed:', data);
    };

    return (
        <div className={s.container}>
            <div className={s.loginCard}>
                <LoginForm
                    title="Админ-панель"
                    subtitle="Войдите для управления магазином"
                    submitButtonText="Войти в админку"
                    showRemember={true}
                    showForgotPassword={true}
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                    onForgotPassword={handleForgotPassword}
                    onChange={handleChange}
                />

                <div className={s.footer}>
                    <a href="/" className={s.backLink}>
                        ← Вернуться на сайт
                    </a>
                </div>
            </div>

            <div className={s.background}>
                <div className={s.gradientOverlay} />
            </div>
        </div>
    );
};

export default AdminLogin;