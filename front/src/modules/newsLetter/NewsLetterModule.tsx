// components/newsLetter/NewsletterModule.tsx
import React, { useState, memo } from 'react';
import { subscribeToNewsletter } from 'src/providers/userProvider';
import s from './style.module.css';

interface NewsletterModuleProps {
    onSubmit?: (email: string) => void;
    className?: string;
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
    variant?: 'dark' | 'light';   // 👈 тёмный/светлый
}

const NewsletterModule: React.FC<NewsletterModuleProps> = memo(
    ({ onSubmit, className, onSuccess, onError, variant = 'dark' }) => {
        const [email, setEmail] = useState('');
        const [isValid, setIsValid] = useState(true);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [serverMessage, setServerMessage] = useState<{
            type: 'success' | 'error';
            text: string;
        } | null>(null);

        const validateEmail = (email: string) => {
            const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
            return re.test(email);
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            if (!email.trim()) {
                setIsValid(false);
                return;
            }

            if (!validateEmail(email)) {
                setIsValid(false);
                return;
            }

            setIsValid(true);
            setIsSubmitting(true);
            setServerMessage(null);

            try {
                subscribeToNewsletter({ email }, (response) => {
                    setIsSubmitting(false);

                    if (response.error) {
                        setServerMessage({
                            type: 'error',
                            text: response.error,
                        });
                        onError?.(response.error);

                        setTimeout(() => setServerMessage(null), 5000);
                    } else {
                        setServerMessage({
                            type: 'success',
                            text:
                                response.message ||
                                'Письмо с подтверждением отправлено! Проверьте вашу почту.',
                        });
                        onSuccess?.(response.message);
                        setEmail('');

                        setTimeout(() => setServerMessage(null), 5000);
                    }

                    onSubmit?.(email);
                });
            } catch (error) {
                setIsSubmitting(false);
                setServerMessage({
                    type: 'error',
                    text: 'Произошла ошибка при отправке. Попробуйте позже.',
                });
            }
        };

        const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
            setIsValid(true);
            setServerMessage(null);
        };

        return (
            <div
                className={`${s.newsletterModule} ${
                    variant === 'dark' ? s.dark : s.light
                } ${className || ''}`}
            >
                <form className={s.newsletterForm} onSubmit={handleSubmit}>
                    <div className={s.inputWrapper}>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Ваш email"
                            disabled={isSubmitting}
                            className={`${s.newsletterInput} ${
                                !isValid ? s.inputError : ''
                            }`}
                        />

                        <button
                            type="submit"
                            className={s.newsletterButton}
                            disabled={isSubmitting}
                            aria-label="Подписаться"
                        >
                            {isSubmitting ? (
                                <span className={s.spinner} />
                            ) : (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M5 12H19M19 12L13 6M19 12L13 18"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>

                    {!isValid && (
                        <p className={s.errorMessage}>
                            Введите корректный email адрес
                        </p>
                    )}

                    {serverMessage && (
                        <p
                            className={
                                serverMessage.type === 'success'
                                    ? s.successMessage
                                    : s.errorMessage
                            }
                        >
                            {serverMessage.text}
                        </p>
                    )}
                </form>
            </div>
        );
    }
);

NewsletterModule.displayName = 'NewsletterModule';

export default NewsletterModule;