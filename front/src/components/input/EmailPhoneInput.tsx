import React, { useEffect, useRef, useState } from 'react';
import s from "./style.module.css";

type Props = {
  valid: boolean;
  invalidText: string;
  onChange: (value: any) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onValid: (value: boolean) => void;
  className?: string;
  invalidClassName?: string;
  placeholder?: string;
  val?: string;
  type?: 'email' | 'phone' | 'auto'; // Добавил тип для явного указания
};

const EmailPhoneInput: React.FC<Props> = (props) => {
  const {
    onChange,
    onFocus,
    onBlur,
    onValid,
    className,
    placeholder,
    val = "",
    valid = true,
    invalidText,
    type = 'auto'
  } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const invalidTextRef = useRef<string>(invalidText);
  const startValidationOnBlur = useRef<boolean>(false);
  const [validState, setValid] = useState<boolean>(valid);
  const [valState, setVal] = useState<string>(val);
  const [inputType, setInputType] = useState<'email' | 'tel' | 'text'>('text');

  // Валидация email
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Валидация телефона (простая, можно доработать)
  const validatePhone = (phone: string): boolean => {
    const re = /^[\d\+][\d\(\)\ -]{4,14}\d$/;
    return re.test(phone);
  };

  // Автоматическое определение типа ввода
  const detectInputType = (value: string): 'email' | 'tel' | 'text' => {
    if (type === 'email') return 'email';
    if (type === 'phone') return 'tel';
    
    if (value.includes('@')) return 'email';
    if (/[\d\+]/.test(value[0])) return 'tel';
    
    return 'text';
  };

  useEffect(() => {
    invalidTextRef.current = invalidText;
    setValid(valid);
  }, [valid, invalidText]);

  useEffect(() => {
    setVal(val);
    setInputType(detectInputType(val));
  }, [val]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVal(value);
    startValidationOnBlur.current = true;
    const currentType = detectInputType(value);
    setInputType(currentType);
    let isValid = false;
    if (currentType === 'email') {
      isValid = validateEmail(value);
    } else if (currentType === 'tel') {
      isValid = validatePhone(value);
    }
    if(validState!==isValid){
      setValid(isValid)
      onValid(isValid);
    }
    isValid && onChange({type:inputType, value: valState} as any);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!startValidationOnBlur.current) return;

    const value = e.target.value;
    let isValid = false;
    let errorText = '';

    if (value) {
      if (inputType === 'email') {
        isValid = validateEmail(value);
        errorText = 'Введите корректный email';
      } else if (inputType === 'tel') {
        isValid = validatePhone(value);
        errorText = 'Введите корректный телефон';
      }
    }

    if (!isValid) {
      invalidTextRef.current = errorText;
      setValid(false);
    }

    if (onBlur) {
      onBlur(value);
    }
  };

  return (
    <div className={s.inputContainer}>
      <input
        ref={inputRef}
        value={valState}
        type={inputType}
        className={validState ? s.inputWithLabel : s.inputWithLabel + " " + s.invalid}
        style={{ boxSizing: 'border-box', width: "100%" }}
        placeholder=""
        onChange={handleChange}
        onFocus={(e) => onFocus?.(e.target.value)}
        onBlur={handleBlur}
        required
      />
      <label 
        onClick={() => inputRef.current?.focus()} 
        className={s.label}
      >
        {placeholder}
      </label>
      {!validState && (
        <label style={{ color: "red" }}>
          {invalidTextRef.current}
        </label>
      )}
    </div>
  );
};

export default EmailPhoneInput;