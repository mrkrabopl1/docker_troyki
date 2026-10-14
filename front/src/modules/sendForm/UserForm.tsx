import React, { useEffect, useState, useCallback } from 'react';
import InputWithLabel from 'src/components/input/InputWithLabel';
import PhoneInputWithValidation from 'src/components/input/PhoneInputWithValidation';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import ChangePasswordForm from './ChangePasswordForm';
import { updateProfile, type CustomerData, type UpdateProfilePayload } from 'src/providers/userProvider';
import s from './style.module.css';

interface UserFormProps {
    className?: {
        input?: string;
        checkbox?: string;
        combobox?: string;
    };
    user: CustomerData | null;
    onSaved: (updated: CustomerData) => void;   // 👈 обязательный
}

const UserForm: React.FC<UserFormProps> = ({ className, user, onSaved }) => {
    const [passForm, setPassForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        secondName: '',
        phone: '',
        mail: '',
    });

    const [errors, setErrors] = useState<Record<string, boolean>>({});

    // Синхронизация с user из Redux
    useEffect(() => {
        if (!user) return;
        setFormData({
            name: user.name || '',
            secondName: user.secondName || '',
            phone: user.phone || '',
            mail: user.mail || '',
        });
    }, [user]);

    const handleFieldChange = useCallback((value: string, field: keyof typeof formData) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const validate = useCallback((): boolean => {
        const newErrors: Record<string, boolean> = {};
        if (!formData.name.trim()) newErrors.name = true;
        if (!formData.phone.trim()) newErrors.phone = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSave = useCallback(async () => {
        if (!validate()) return;

        setSaving(true);
        setError(null);

        try {
            const payload: UpdateProfilePayload = {
                name: formData.name,
                second_name: formData.secondName,
                phone: formData.phone,
            };

            const updated = await updateProfile(payload);
            onSaved(updated);   // 👈 обновляем Redux
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    }, [formData, validate, onSaved]);

    return (
        <div className={s.wrapper}>
            <div style={{ display: 'flex', gap: 12 }}>
                <InputWithLabel
                    className={className?.input}
                    val={formData.name}
                    onChange={(data) => handleFieldChange(data, 'name')}
                    placeholder="Имя"
                />
                <InputWithLabel
                    className={className?.input}
                    val={formData.secondName}
                    onChange={(data) => handleFieldChange(data, 'secondName')}
                    placeholder="Фамилия"
                />
            </div>

            <MailInputWithValidation
                valid={!errors.mail}
                invalidText="Введите адрес электронной почты."
                className={className?.input}
                
                onChange={(data) => handleFieldChange(data, 'mail')}
                placeholder="Электронный адрес"
            />

            <PhoneInputWithValidation
                invalidIncorrect="Неверный формат"
                invalidEmpty="Введите телефон"
                valid={!errors.phone}
                className={className?.input}
                val={formData.phone}
                onChange={(data) => handleFieldChange(data, 'phone')}
                placeholder="Телефон"
            />

            <Button
                className={s.buttonConf}
                text="Изменить пароль"
                onClick={() => setPassForm(true)}
            />

            <Button
                className={s.buttonConf}
                text={saving ? 'Сохраняем...' : 'Сохранить изменения'}
                onClick={handleSave}
                disabled={saving}
            />

            {error && <div className={s.error}>{error}</div>}

            {passForm && (
                <Modal onChange={() => setPassForm(false)} active={true}>
                    <div className={s.modal}>
                        <ChangePasswordForm />
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default UserForm;