import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { confirmPasswordReset } from 'src/providers/adminAuth';
import ResetPasswordForm from 'src/modules/loginForm/ResetPasswordForm';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch} from 'src/store/hooks/redux'


const AdminResetPassword: React.FC = () => {
    const router = useRouter();
    const token = router.query.token as string;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
     const dispatch = useAppDispatch();
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(finishLoading());
        }, 0);
        return () => clearTimeout(timer);
    }, [dispatch]);
    const handleSubmit = (data: { password: string }) => {
        if (!token) {
            setError('Токен не найден');
            return;
        }

        setIsLoading(true);
        setError(null);

        confirmPasswordReset(
            { token, new_pass: data.password },
            (result) => {
                setIsLoading(false);

                if (result) {
                    setIsSuccess(true);
                    setTimeout(() => {
                        router.push('/admin/login');
                    }, 3000);
                } else {
                    setError('Ошибка смены пароля. Возможно, токен истек.');
                }
            }
        );
    };

    if (isSuccess) {
        return (
            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.successMessage}>
                        <div className={s.successIcon}>✓</div>
                        <h2>Пароль успешно изменен!</h2>
                        <p>Сейчас вы будете перенаправлены на страницу входа...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={s.container}>
            <div className={s.card}>
                <ResetPasswordForm
                    title="Создание нового пароля"
                    subtitle="Придумайте новый надежный пароль"
                    submitButtonText="Сохранить пароль"
                    isLoading={isLoading}
                    error={error}
                    onSubmit={handleSubmit}
                    validationRules={{
                        password: (value: string): string | null => {
                            if (!value) return 'Пароль обязателен';
                            if (value.length < 8) return 'Пароль админа должен быть не менее 8 символов';
                            if (!/[A-Z]/.test(value)) return 'Пароль должен содержать заглавную букву';
                            if (!/[0-9]/.test(value)) return 'Пароль должен содержать цифру';
                            return null;
                        }
                    }}
                />
            </div>

            <div className={s.background}>
                <div className={s.gradientOverlay} />
            </div>
        </div>
    );
};

export default AdminResetPassword;