import React, { useState, useCallback, useEffect, memo } from 'react';
import AddressInput from 'src/modules/sendForm/AddressInput';
import InputWithLabel from 'src/components/input/InputWithLabel';
import Button from 'src/components/Button';
import s from './style.module.css';

export interface AddressFormValues {
    town: string;
    region?: string;
    index?: string;
    street?: string;
    house?: string;
    flat?: string;
    settlement?: string;
    coordinates: number[];
    is_default: boolean;
}

interface AddressFormProps {
    valid?: boolean;
    /** null или undefined — создание нового. Объект с id — редактирование. */
    address?: (AddressFormValues & { id?: number }) | null;
    onSaved: (data: AddressFormValues) => void;
    onCancel: () => void;
}

const DEFAULT_VALUES: AddressFormValues = {
    town: '',
    region: '',
    index: '',
    street: '',
    house: '',
    flat: '',
    settlement: '',
    coordinates: [],
    is_default: false,
};

const AddressForm: React.FC<AddressFormProps> = ({
    address,
    onSaved,
    onCancel,
}) => {
    const [formData, setFormData] = useState<AddressFormValues>(DEFAULT_VALUES);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    // Синхронизация с address при монтировании / изменении
    useEffect(() => {
        if (address) {
            setFormData({
                town: address.town || '',
                region: address.region || '',
                index: address.index || '',
                street: address.street || '',
                house: address.house || '',
                flat: address.flat || '',
                settlement: address.settlement || '',
                coordinates: address.coordinates || [],
                is_default: address.is_default || false,
            });
        } else {
            setFormData(DEFAULT_VALUES);
        }
    }, [address]);

    // AddressInput отдаёт данные из DaData
    const handleAddressInputChange = useCallback((addr: any) => {
        if (typeof addr === 'string') return;

        setFormData(prev => ({
            ...prev,
            town: addr.town || prev.town,
            street: addr.street || prev.street,
            house: addr.house || prev.house,
            index: addr.index || prev.index,
            settlement: addr.settlement || prev.settlement,
            coordinates: addr.coordinates || prev.coordinates,
        }));

        setErrors(prev => {
            const next = { ...prev };
            if (addr.town) delete next.town;
            if (addr.street) delete next.street;
            return next;
        });
    }, []);

    const handleChange = useCallback((field: keyof AddressFormValues, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const handleCheckbox = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, is_default: e.target.checked }));
    }, []);

    const validate = useCallback((): boolean => {
        const newErrors: Record<string, boolean> = {};
        if (!formData.town) newErrors.town = true;
        if (!formData.street) newErrors.street = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSave = useCallback(() => {
        if (!validate()) return;

        const { value, ...payload } = formData as any;
        onSaved(payload);
    }, [formData, validate, onSaved]);

    return (
        <div className={s.form}>
            <h3 className={s.title}>
                {address?.id ? 'Редактировать адрес' : 'Новый адрес'}
            </h3>

            {/* 👇 val="" — AddressInput сам хранит своё значение, не пересчитываем */}
            <AddressInput
                onChange={handleAddressInputChange}
                val=""
                valid={!errors.town && !errors.street}
                placeholder="Введите адрес"
            />

            <div className={s.row}>
                <InputWithLabel
                    val={formData.town}
                    onChange={(v) => handleChange('town', v)}
                    placeholder="Город"
                    className={errors.town ? s.inputError : ''}
                />
                <InputWithLabel
                    val={formData.region ?? ''}
                    onChange={(v) => handleChange('region', v)}
                    placeholder="Регион"
                />
            </div>

            <div className={s.row}>
                <InputWithLabel
                    val={formData.street ?? ''}
                    onChange={(v) => handleChange('street', v)}
                    placeholder="Улица"
                    className={errors.street ? s.inputError : ''}
                />
                <InputWithLabel
                    val={formData.house ?? ''}
                    onChange={(v) => handleChange('house', v)}
                    placeholder="Дом"
                />
                <InputWithLabel
                    val={formData.flat ?? ''}
                    onChange={(v) => handleChange('flat', v)}
                    placeholder="Квартира"
                />
            </div>

            <div className={s.row}>
                <InputWithLabel
                    val={formData.index ?? ''}
                    onChange={(v) => handleChange('index', v)}
                    placeholder="Индекс"
                />
                <InputWithLabel
                    val={formData.settlement ?? ''}
                    onChange={(v) => handleChange('settlement', v)}
                    placeholder="Населённый пункт"
                />
            </div>

            <label className={s.checkbox}>
                <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={handleCheckbox}
                />
                <span>Сделать основным адресом</span>
            </label>

            <div className={s.actions}>
                <Button
                    className={s.saveBtn}
                    text="Сохранить"
                    onClick={handleSave}
                />
                <button
                    type="button"
                    className={s.cancelBtn}
                    onClick={onCancel}
                >
                    Отмена
                </button>
            </div>
        </div>
    );
};

export default memo(AddressForm);