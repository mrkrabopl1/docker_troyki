// src/components/admin/FirmForm/FirmForm.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Button from 'src/components/Button';
import { ReactComponent as UploadIcon } from '/public/upload.svg';
import deleteIconUrl from '/public/delete.svg';
import s from './style.module.css';
import { BrandLine, FirmFormData } from 'src/types/adminProduct';

interface FirmFormProps {
    initialData?: {
        id?: number;
        name: string;
        image_path?: string;
        description?: string;
        website?: string;
        country?: string;
        founded_year?: number;
        is_active?: boolean;
        sort_order?: number;
        lines?: BrandLine[];
    };
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    onValid?: (isValid: boolean) => void;
}

const FirmForm: React.FC<FirmFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    onValid
}) => {


    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        website: initialData?.website || '',
        country: initialData?.country || '',
        founded_year: initialData?.founded_year || '',
    });

    const [lines, setLines] = useState<BrandLine[]>(initialData?.lines || []);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>(initialData?.image_path || '');
    const [errors, setErrors] = useState<{ name?: string; image?: string }>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [dragActive, setDragActive] = useState(false);

    // Валидация формы (обязательные: name и image)
    useEffect(() => {
        const errors: Record<string, boolean> = {};
        let hasErrors = false;

        // Проверка обязательных полей
        if (!formData.name.trim()) {
            errors.name = true;
            hasErrors = true;
        }

        if (!imageFile && !initialData?.image_path) {
            errors.image = true;
            hasErrors = true;
        }

        setValidationErrors(errors);
        onValid?.(!hasErrors);
    }, [formData.name, imageFile, initialData?.image_path, onValid]);

    // Drag & Drop handlers
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageSelect(files[0]);
        }
    }, []);

    const handleImageSelect = (file: File) => {
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        // Очищаем ошибку изображения
        setErrors(prev => ({ ...prev, image: undefined }));
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageSelect(e.target.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Управление линейками
    const handleAddLine = () => {
        setLines([...lines, { name: '', description: '', season: '', year: undefined }]);
    };

    const handleRemoveLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const handleLineChange = (index: number, field: keyof BrandLine, value: string | number) => {
        const updatedLines = [...lines];
        updatedLines[index] = { ...updatedLines[index], [field]: value };
        setLines(updatedLines);
    };

    const handleFieldChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Очищаем ошибку name при изменении
        if (field === 'name' && value.trim()) {
            setErrors(prev => ({ ...prev, name: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { name?: string; image?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Название бренда обязательно';
        }

        if (!imageFile && !initialData?.image_path) {
            newErrors.image = 'Изображение бренда обязательно';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const submitData = new FormData();

        // Основные поля бренда
        submitData.append('name', formData.name);
        if (formData.description) submitData.append('description', formData.description);
        if (formData.website) submitData.append('website', formData.website);
        if (formData.country) submitData.append('country', formData.country);


        if (formData.founded_year) {
            submitData.append('founded_year', String(formData.founded_year));
        }

        if (imageFile) {
            submitData.append('image', imageFile);
        }

        if (initialData?.id) {
            submitData.append('id', String(initialData.id));
        }

        // Добавляем линейки (только если они есть и заполнены)
        lines.forEach((line, index) => {
            if (line.name) {
                submitData.append(`lines[${index}][name]`, line.name);


                if (line.description) {
                    submitData.append(`lines[${index}][description]`, line.description);
                }
                if (line.season) {
                    submitData.append(`lines[${index}][season]`, line.season);
                }
                if (line.year) {
                    submitData.append(`lines[${index}][year]`, String(line.year));
                }
                if (line.id) {
                    submitData.append(`lines[${index}][id]`, String(line.id));
                }
            }
        });

        await onSubmit(submitData);
    };

    return (
        <div onClick={(e) => e.stopPropagation()} className={s.firmForm}>
            <div className={s.formContent}>
                {/* Изображение бренда */}
                <div className={s.imageSection}>
                    <label className={s.label}>
                        Логотип/изображение бренда <span className={s.required}>*</span>
                    </label>
                    <div
                        ref={dropZoneRef}
                        className={`${s.dropZone} ${dragActive ? s.dragActive : ''} ${validationErrors.image ? s.error : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                        />

                        {imagePreview ? (
                            <div className={s.imagePreviewContainer}>
                                <img src={imagePreview} alt="Brand preview" className={s.imagePreview} />
                                <button
                                    className={s.removeImageBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage();
                                    }}
                                    type="button"
                                >
                                    <img src={deleteIconUrl} alt="remove" />
                                </button>
                            </div>
                        ) : (
                            <div className={s.dropZoneContent}>
                                <UploadIcon className={s.uploadIcon} />
                                <p>Перетащите изображение или кликните для выбора</p>
                                <span className={s.hint}>Рекомендуемый размер: 200x200px</span>
                            </div>
                        )}
                    </div>
                    {errors.image && <div className={s.errorMessage}>{errors.image}</div>}
                </div>

                {/* Основная информация */}
                <div className={s.infoSection}>
                    <div className={s.formGroup}>
                        <label className={s.label}>
                            Название бренда <span className={s.required}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="Введите название бренда"
                            className={errors.name || validationErrors.name ? s.error : ''}
                            autoFocus
                        />
                        {errors.name && <div className={s.errorMessage}>{errors.name}</div>}
                    </div>

                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label className={s.label}>Страна</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => handleFieldChange('country', e.target.value)}
                                placeholder="Страна происхождения"
                            />
                        </div>
                        <div className={s.formGroup}>
                            <label className={s.label}>Год основания</label>
                            <input
                                type="number"
                                value={formData.founded_year}
                                onChange={(e) => handleFieldChange('founded_year', e.target.value)}
                                placeholder="Год основания"
                            />
                        </div>
                    </div>

                    <div className={s.formGroup}>
                        <label className={s.label}>Веб-сайт</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleFieldChange('website', e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label className={s.label}>Описание</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Введите описание бренда (необязательно)"
                            rows={4}
                        />
                    </div>

                    {/* Линейки бренда */}
                    <div className={s.linesSection}>
                        <div className={s.sectionHeader}>
                            <label className={s.label}>Линейки / Коллекции</label>
                            <Button
                                className={'btnStyle'}
                                text="Добавить линейку"
                                onClick={handleAddLine}
                                type="button"
                            />
                        </div>

                        {lines.map((line, index) => (
                            <div key={index} className={s.lineItem}>
                                <div className={s.lineHeader}>
                                    <h4>Линейка {index + 1}</h4>
                                    <button
                                        className={s.removeLineBtn}
                                        onClick={() => handleRemoveLine(index)}
                                        type="button"
                                    >
                                        <img src={deleteIconUrl} alt="remove" />
                                    </button>
                                </div>

                                <div className={s.formGroup}>
                                    <label>Название линейки</label>
                                    <input
                                        type="text"
                                        value={line.name}
                                        onChange={(e) => handleLineChange(index, 'name', e.target.value)}
                                        placeholder="Введите название линейки"
                                    />
                                </div>

                                <div className={s.formRow}>
                                    <div className={s.formGroup}>
                                        <label>Сезон</label>
                                        <select
                                            value={line.season || ''}
                                            onChange={(e) => handleLineChange(index, 'season', e.target.value)}
                                        >
                                            <option value="">Выберите сезон</option>
                                            <option value="spring">Весна</option>
                                            <option value="summer">Лето</option>
                                            <option value="autumn">Осень</option>
                                            <option value="winter">Зима</option>
                                            <option value="spring-summer">Весна-Лето</option>
                                            <option value="autumn-winter">Осень-Зима</option>
                                        </select>
                                    </div>
                                    <div className={s.formGroup}>
                                        <label>Год</label>
                                        <input
                                            type="number"
                                            value={line.year || ''}
                                            onChange={(e) => handleLineChange(index, 'year', parseInt(e.target.value))}
                                            placeholder="Год выпуска"
                                        />
                                    </div>
                                </div>

                                <div className={s.formGroup}>
                                    <label>Описание линейки</label>
                                    <textarea
                                        value={line.description || ''}
                                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                        placeholder="Описание линейки (необязательно)"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ))}

                        {lines.length === 0 && (
                            <div className={s.emptyLines}>
                                <p>Нет добавленных линеек. Нажмите "Добавить линейку"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={s.formActions}>
                <Button
                    className={'btnStyle'}
                    text="Отмена"
                    onClick={onCancel}
                    disabled={isLoading}
                    type="button"
                />
                <Button
                    className={'btnStyle'}
                    text={initialData?.id ? 'Сохранить' : 'Создать'}
                    onClick={handleSubmit}
                    disabled={isLoading || Object.keys(validationErrors).length > 0}
                    type="button"
                />
            </div>
        </div>
    );
};

export default FirmForm;