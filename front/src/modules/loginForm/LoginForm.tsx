// modules/loginForm/LoginForm.tsx
import React, { useState, useCallback } from 'react';
import s from "./login.module.css";
import Button from 'src/components/Button';
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';

interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

interface LoginFormModuleInterface {
  className?: {
    input?: string;
    checkbox?: string;
    container?: string;
  };
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  showRemember?: boolean;
  showForgotPassword?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (data: LoginFormData) => void | Promise<void>;
  onForgotPassword?: () => void;
  onChange?: (data: Partial<LoginFormData>) => void;
  // Дополнительные правила валидации (поверх дефолтных)
  customValidation?: {
    email?: (value: string) => string | null;
    password?: (value: string) => string | null;
  };
}

const LoginForm: React.FC<LoginFormModuleInterface> = ({
  className = {},
  title = 'Вход',
  subtitle,
  submitButtonText = 'Войти',
  showRemember = true,
  showForgotPassword = true,
  isLoading = false,
  error = null,
  onSubmit,
  onForgotPassword,
  onChange,
  customValidation = {}
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false
  });
  
  // Состояния валидности полей
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Обработчик изменения email
  const handleEmailChange = useCallback((value: string | null) => {
    const newFormData = { ...formData, email: value || '' };
    setFormData(newFormData);
   
    if (!value && customValidation.email) {
      const error = customValidation.email('');
      setEmailError(error || 'Некорректный email');
    }
    
    onChange?.(newFormData);
  }, [formData, onChange, customValidation]);

  // Обработчик изменения пароля
  const handlePasswordChange = useCallback((value: string) => {
    const newFormData = { ...formData, password: value };
    setFormData(newFormData);
    setIsPasswordValid(true); // Сбрасываем до blur
    onChange?.(newFormData);
  }, [formData, onChange]);

  // Обработчик blur пароля (для валидации)
  const handlePasswordBlur = useCallback((value: string) => {
    // Валидация уже произошла внутри компонента
    // Здесь можно добавить дополнительную логику
    console.debug('Password blurred:', value);
  }, []);


  // Обработчик чекбокса
  const handleRememberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({ ...prev, remember: checked }));
    onChange?.({ ...formData, remember: checked });
  }, [formData, onChange]);

  // Обработчик отправки формы
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Проверяем что email валиден
    if (!formData.email || !isEmailValid) {
      setIsEmailValid(false);
      setEmailError('Email обязателен');
      return;
    }
    
    // Проверяем что пароль введен
    if (!formData.password) {
      setIsPasswordValid(false);
      setPasswordError('Пароль обязателен');
      return;
    }
    
    // Отправляем форму
    await onSubmit(formData);
  }, [formData, isEmailValid, onSubmit]);

  const isFormValid = isEmailValid && isPasswordValid && formData.email && formData.password;

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      className={`${s.main} ${className.container || ''}`}
    >
      {title && <div className={s.caption}>{title}</div>}
      {subtitle && <div className={s.subtitle}>{subtitle}</div>}
      
      {error && (
        <div className={s.globalError}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={s.form}>
        <MailInputWithValidation 
          valid={isEmailValid}
          invalidText={emailError || 'Некорректный email'}
          value={formData.email}
          onChange={handleEmailChange}
          placeholder="Электронный адрес"
          className={className.input}
        />
        
        <PasswordInputWithValidation 
          showToggle={true}
          valid={isPasswordValid}
          invalidText={passwordError || 'Некорректный пароль'}
          value={formData.password}
          onChange={handlePasswordChange}
          onBlur={handlePasswordBlur}
          validRule={customValidation.password}
          className={`${s.loginInput} ${className.input || ''}`}
          placeholder="Пароль"
        />
        
        {showRemember && (
          <label className={s.rememberLabel}>
            <input
              type="checkbox"
              checked={formData.remember}
              onChange={handleRememberChange}
              className={className.checkbox}
            />
            <span>Запомнить меня</span>
          </label>
        )}
        
        <Button 
          className={s.loginButton}
          onClick={() => handleSubmit()}
          text={isLoading ? 'Загрузка...' : submitButtonText}
          disabled={isLoading || !isFormValid}
          type="submit"
        />
        
        {showForgotPassword && onForgotPassword && (
          <span 
            className={s.forgetPass} 
            onClick={onForgotPassword}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onForgotPassword();
              }
            }}
          >
            Забыли пароль?
          </span>
        )}
      </form>
    </div>
  );
};

export default LoginForm;