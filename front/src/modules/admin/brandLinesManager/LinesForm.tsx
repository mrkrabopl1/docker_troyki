// src/components/admin/LineForm/LineForm.tsx
import React, { useState, useRef, useCallback } from 'react';
import Button from 'src/components/Button';
import { ReactComponent as UploadIcon } from '/public/upload.svg';
import deleteIconUrl from '/public/delete.svg';
import s from './style.module.css';

export interface LineFormData {
  id?: number;
  name: string;
  description?: string;
  season?: string;
  year?: number;
  image_path?: string;
}

interface LineFormProps {
  initialData?: LineFormData;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const LinesForm: React.FC<LineFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    season: initialData?.season || '',
    year: initialData?.year?.toString() || ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image_path || '');
  const [errors, setErrors] = useState<{ name?: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

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
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название линейки обязательно';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const submitData = new FormData();
    
    submitData.append('name', formData.name);
    if (formData.description) submitData.append('description', formData.description);
    if (formData.season) submitData.append('season', formData.season);
    if (formData.year) submitData.append('year', formData.year);
    
    if (imageFile) {
      submitData.append('image', imageFile);
    }
    
    if (initialData?.id) {
      submitData.append('id', String(initialData.id));
    }
    
    await onSubmit(submitData);
  };

  return (
    <div className={s.lineForm}>
      <div className={s.formContent}>
        <div className={s.imageSection}>
          <label className={s.label}>Изображение линейки</label>
          <div
            className={`${s.dropZone} ${dragActive ? s.dragActive : ''}`}
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
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageSelect(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
            />
            
            {imagePreview ? (
              <div className={s.imagePreviewContainer}>
                <img src={imagePreview} alt="Preview" className={s.imagePreview} />
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
              </div>
            )}
          </div>
        </div>

        <div className={s.infoSection}>
          <div className={s.formGroup}>
            <label className={s.label}>
              Название линейки <span className={s.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Введите название линейки"
              className={errors.name ? s.error : ''}
              autoFocus
            />
            {errors.name && <div className={s.errorMessage}>{errors.name}</div>}
          </div>

          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.label}>Сезон</label>
              <select
                value={formData.season}
                onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
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
              <label className={s.label}>Год</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                placeholder="Год выпуска"
                min="1900"
                max="2100"
              />
            </div>
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Введите описание линейки"
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className={s.formActions}>
        <Button 
          text="Отмена" 
          onClick={onCancel} 
          disabled={isLoading}
          type="button"
        />
        <Button 
          text={initialData?.id ? 'Сохранить' : 'Создать'}
          onClick={handleSubmit}
          disabled={isLoading || !formData.name.trim()}
          type="button"
        />
      </div>
    </div>
  );
};

export default LinesForm;