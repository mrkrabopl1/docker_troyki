import React, { useEffect, useRef, useState, useCallback } from 'react';
import s from "./style.module.css";

type InputType = 'email' | 'phone'| 'text';
type InputMode = 'email' | 'phone' | 'auto';

type Props = {
  valid?: boolean;
  invalidText?: string;
  onChange: (value: { type: InputType; value: string }) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onValid?: (isValid: boolean) => void;
  className?: string;
  invalidClassName?: string;
  placeholder?: string;
  val?: string;
  type?: InputMode;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\+][\d\(\)\ -]{4,14}\d$/;

const EmailPhoneInput: React.FC<Props> = ({
  onChange,
  onFocus,
  onBlur,
  onValid,
  className = '',
  placeholder = '',
  val = '',
  valid = true,
  invalidText = '',
  type = 'auto'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(val);
  const [isValid, setIsValid] = useState(valid);
  const [currentType, setCurrentType] = useState<InputType>('text');

  // Определение типа ввода
  const detectInputType = useCallback((value: string): InputType => {
    if (type === 'email') return 'email';
    if (type === 'phone') return 'phone';
    if (value.includes('@')) return 'email';
    if (/[\d\+]/.test(value[0])) return 'phone';
    return 'text';
  }, [type]);

  // Валидация ввода
  const validateInput = useCallback((value: string, type: InputType): boolean => {
    if (!value) return true;
    return type === 'email' 
      ? EMAIL_REGEX.test(value) 
      : type === 'phone' 
        ? PHONE_REGEX.test(value) 
        : true;
  }, []);

  // Обновление состояния при изменении внешнего значения
  useEffect(() => {
    setInputValue(val);
    const detectedType = detectInputType(val);
    setCurrentType(detectedType);
    setIsValid(valid);
  }, [val, valid, detectInputType]);

  // Обработчик изменения значения
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const detectedType = detectInputType(value);
    const isValidInput = validateInput(value, detectedType);

    setInputValue(value);
    setCurrentType(detectedType);
    setIsValid(isValidInput);

    if (isValidInput) {
      onChange({ type: detectedType, value });
    }

    onValid?.(isValidInput);
  }, [detectInputType, onChange, onValid, validateInput]);

  // Обработчик потери фокуса
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isValidInput = validateInput(value, currentType);
    setIsValid(isValidInput);
    onBlur?.(value);
    onValid?.(isValidInput);
  }, [currentType, onBlur, onValid, validateInput]);

  // Классы для инпута
  const inputClasses = [
    s.inputWithLabel,
    className,
    !isValid ? s.invalid : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={s.inputContainer}>
      <input
        ref={inputRef}
        value={inputValue}
        type={currentType}
        className={inputClasses}
            aria-label={placeholder}
        style={{ boxSizing: 'border-box', width: "100%" }}
     placeholder=''
        onChange={handleChange}
        onFocus={(e) => onFocus?.(e.target.value)}
        onBlur={handleBlur}
        aria-invalid={!isValid}
      />
      {placeholder && (
        <label 
          onClick={() => inputRef.current?.focus()} 
          className={s.label}
        >
          {placeholder}
        </label>
      )}
      {!isValid && invalidText && (
        <div className={s.errorMessage}>
          {invalidText}
        </div>
      )}
    </div>
  );
};

export default React.memo(EmailPhoneInput);