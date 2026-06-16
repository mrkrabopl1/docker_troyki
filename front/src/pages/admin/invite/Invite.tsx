// pages/admin/accept-invite.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { verifyInviteToken, acceptInvite } from 'src/providers/adminProvider';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

const AcceptInvite: React.FC = () => {
    const router = useRouter();
    const token = router.query.token as string;
    const dispatch = useAppDispatch();
    dispatch(finishLoading());
    
    const [step, setStep] = useState<'loading' | 'valid' | 'expired' | 'error' | 'form' | 'success'>('loading');
    const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
    const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setStep('error');
            return;
        }
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const data = await verifyInviteToken(token!);
            if (data.valid) {
                setInviteData({ email: data.email, role: data.role });
                setStep('form');
            } else {
                setStep('expired');
            }
        } catch (err) {
            setStep('expired');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!form.name.trim()) { setError('Введите имя'); return; }
        if (form.password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
        if (form.password !== form.confirmPassword) { setError('Пароли не совпадают'); return; }

        try {
            await acceptInvite({ token: token!, name: form.name, password: form.password });
            setStep('success');
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании аккаунта');
        }
    };

    if (step === 'loading') {
        return (
            <div className={s.container}>
                <div className={s.card}>
                    <h2>Проверка приглашения...</h2>
                    <div className={s.loader}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (step === 'expired' || step === 'error') {
        return (
            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.errorIcon}>❌</div>
                    <h2>Приглашение недействительно</h2>
                    <p>{step === 'expired' ? 'Срок действия приглашения истек или оно уже было использовано.' : 'Недействительный токен приглашения.'}</p>
                    <p>Обратитесь к администратору для получения нового приглашения.</p>
                    <button className={s.backBtn} onClick={() => router.push('/admin/login')}>Вернуться на страницу входа</button>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className={s.container}>
                <div className={s.card}>
                    <div className={s.successIcon}>✅</div>
                    <h2>Аккаунт создан!</h2>
                    <p>Ваш администраторский аккаунт успешно создан.</p>
                    <p>Теперь вы можете войти в панель управления.</p>
                    <button className={s.loginBtn} onClick={() => router.push('/admin/login')}>Перейти ко входу</button>
                </div>
            </div>
        );
    }

    return (
        <div className={s.container}>
            <div className={s.card}>
                <h2>Примите приглашение</h2>
                <p className={s.subtitle}>Вы были приглашены как <strong>{inviteData?.role === 'superadmin' ? 'Суперадминистратор' : 'Администратор'}</strong></p>
                <div className={s.emailInfo}>
                    <span className={s.label}>Email:</span>
                    <span className={s.email}>{inviteData?.email}</span>
                </div>
                {error && <div className={s.error}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className={s.formGroup}>
                        <label htmlFor="name">Имя:</label>
                        <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Введите ваше имя" autoFocus />
                    </div>
                    <div className={s.formGroup}>
                        <label htmlFor="password">Пароль:</label>
                        <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Минимум 6 символов" />
                    </div>
                    <div className={s.formGroup}>
                        <label htmlFor="confirmPassword">Подтвердите пароль:</label>
                        <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Повторите пароль" />
                    </div>
                    <button type="submit" className={s.submitBtn}>Создать аккаунт</button>
                </form>
            </div>
        </div>
    );
};

export default AcceptInvite;