// pages/admin/ForgotPassword/ForgotPassword.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { requestPasswordReset } from 'src/providers/adminAuth';
import ForgotPasswordForm from 'src/modules/loginForm/ForgotPasswordForm';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux'
const AdminForgotPassword: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    dispatch(finishLoading());
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

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(finishLoading());
        }, 0);
        return () => clearTimeout(timer);
    }, [dispatch]);

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
                    onBack={() => router.push('/admin/login')}
                />
            </div>

            <div className={s.background}>
                <div className={s.gradientOverlay} />
            </div>
        </div>
    );
};

export default AdminForgotPassword;