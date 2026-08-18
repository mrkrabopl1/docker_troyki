// src/modules/admin/lineForm/LineForm.tsx
import React, { useState, useEffect } from 'react';
import s from './style.module.css';

interface LineFormProps {
    initialData?: any;
    onSubmit: (data: FormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

const LineForm: React.FC<LineFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
    const [name, setName] = useState('');
    const [brandId, setBrandId] = useState<number | null>(null);
    const [season, setSeason] = useState('');
    const [year, setYear] = useState<number | null>(null);
    const [description, setDescription] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [brands, setBrands] = useState<any[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setBrandId(initialData.brand_id || null);
            setSeason(initialData.season || '');
            setYear(initialData.year || null);
            setDescription(initialData.description || '');
            setSortOrder(initialData.sort_order || 0);
            setIsActive(initialData.is_active !== undefined ? initialData.is_active : true);
        }
    }, [initialData]);

    useEffect(() => {
        const loadBrands = async () => {
            setLoadingBrands(true);
            try {
                const response = await fetch('/api/admin/brands?page=1&pageSize=999&is_active=true');
                const data = await response.json();
                setBrands(data.brands || []);
            } catch (error) {
                console.error('Error loading brands:', error);
            } finally {
                setLoadingBrands(false);
            }
        };
        loadBrands();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        if (brandId) formData.append('brand_id', String(brandId));
        if (season) formData.append('season', season);
        if (year) formData.append('year', String(year));
        if (description) formData.append('description', description);
        formData.append('sort_order', String(sortOrder));
        formData.append('is_active', String(isActive));
        if (imageFile) formData.append('image', imageFile);

        await onSubmit(formData);
    };

    return (
        <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.field}>
                <label>Название линейки *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
            </div>

            <div className={s.field}>
                <label>Бренд *</label>
                <select value={brandId || ''} onChange={(e) => setBrandId(Number(e.target.value) || null)} required disabled={isLoading || loadingBrands}>
                    <option value="">Выберите бренд</option>
                    {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            <div className={s.fieldRow}>
                <div className={s.field}>
                    <label>Сезон</label>
                    <select value={season} onChange={(e) => setSeason(e.target.value)} disabled={isLoading}>
                        <option value="">Не указан</option>
                        <option value="spring">Весна</option>
                        <option value="summer">Лето</option>
                        <option value="autumn">Осень</option>
                        <option value="winter">Зима</option>
                        <option value="spring-summer">Весна-Лето</option>
                        <option value="autumn-winter">Осень-Зима</option>
                    </select>
                </div>
                <div className={s.field}>
                    <label>Год</label>
                    <input type="number" value={year || ''} onChange={(e) => setYear(Number(e.target.value) || null)} min={2000} max={2030} disabled={isLoading} />
                </div>
            </div>

            <div className={s.field}>
                <label>Описание</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isLoading} />
            </div>

            <div className={s.fieldRow}>
                <div className={s.field}>
                    <label>Порядок сортировки</label>
                    <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} min={0} max={999} disabled={isLoading} />
                </div>
                <div className={s.field}>
                    <label>Активен</label>
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isLoading} />
                </div>
            </div>

            {/* <div className={s.field}>
                <label>Изображение</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} disabled={isLoading} />
                {initialData?.image_path && !imageFile && (
                    <div className={s.currentImage}>
                        <span>Текущее:</span>
                        <img src={initialData.image_path} alt={initialData.name} />
                    </div>
                )}
            </div> */}

            <div className={s.actions}>
                <button type="button" onClick={onCancel} disabled={isLoading}>Отмена</button>
                <button type="submit" disabled={isLoading || !name || !brandId}>
                    {isLoading ? 'Сохранение...' : initialData ? 'Обновить' : 'Создать'}
                </button>
            </div>
        </form>
    );
};

export default LineForm;