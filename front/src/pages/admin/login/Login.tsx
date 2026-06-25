// pages/admin/login.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginAdmin } from 'src/providers/adminAuth';
import LoginForm from 'src/modules/loginForm/LoginForm';
import s from './style.module.css';
import { useAppDispatch } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice';

const AdminLogin: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(finishLoading());
        }, 0);
        return () => clearTimeout(timer);
    }, [dispatch]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectTo = (router.query.redirect as string) || '/admin/dashboard';

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
                router.replace(redirectTo);
            }
        });
    }

    const handleForgotPassword = () => {
        router.push('/admin/forgot-password');
    };

    const handleChange = (data: Partial<{ email: string; password: string }>) => {
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
                    <a href="/" className={s.backLink}>← Вернуться на сайт</a>
                </div>
            </div>
            <div className={s.background}>
                <div className={s.gradientOverlay} />
            </div>
        </div>
    );
};

export default AdminLogin;