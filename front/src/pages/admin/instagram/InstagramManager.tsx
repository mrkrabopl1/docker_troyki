// src/pages/admin/instagramManager/InstagramManager.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    getAdminInstagramPhotos,
    uploadInstagramPhotos,
    deleteInstagramPhoto,
    toggleInstagramPhoto,
    InstagramPhoto,
    AdminInstagramResponse
} from 'src/providers/instagramProvider';

import Button from 'src/components/Button';
import s from './style.module.css';
import deleteIconUrl from '/public/delete.svg';

const InstagramManager: React.FC = () => {
    const [photos, setPhotos] = useState<InstagramPhoto[]>([]);
    const [total, setTotal] = useState(0);
    const [active, setActive] = useState(0);
    const [max, setMax] = useState(20);
    const [canAdd, setCanAdd] = useState(true);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadPhotos = useCallback(() => {
        setLoading(true);
        getAdminInstagramPhotos((response: AdminInstagramResponse) => {
            setPhotos(response.photos);
            setTotal(response.total);
            setActive(response.active);
            setMax(response.max);
            setCanAdd(response.can_add);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    const handleUpload = async (files: File[]) => {
        if (!canAdd) {
            alert(`Максимум ${max} фото. Удалите лишние перед загрузкой новых.`);
            return;
        }

        setUploading(true);
        uploadInstagramPhotos(
            files,
            (response) => {
                if (response.uploaded > 0) {
                    loadPhotos();
                    alert(`Успешно загружено ${response.uploaded} фото`);
                }
                if (response.warnings && response.warnings.length > 0) {
                    alert(`Предупреждения:\n${response.warnings.join('\n')}`);
                }
                setUploading(false);
            },
            (error) => {
                alert('Ошибка загрузки фото');
                setUploading(false);
            }
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('Удалить это фото?')) return;
        
        deleteInstagramPhoto(
            id,
            () => {
                loadPhotos();
            },
            () => {
                alert('Ошибка удаления фото');
            }
        );
    };

    const handleToggle = (id: number) => {
        toggleInstagramPhoto(
            id,
            () => {
                loadPhotos();
            },
            () => {
                alert('Ошибка изменения статуса');
            }
        );
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                handleUpload(files);
            }
        }
    }, [handleUpload]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                handleUpload(files);
            }
        }
        e.target.value = '';
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление Instagram лентой</h2>
                <div className={s.stats}>
                    <span>Всего: {total}</span>
                    <span>Активных: {active}</span>
                    <span>Максимум: {max}</span>
                    <span className={canAdd ? s.canAdd : s.cantAdd}>
                        {canAdd ? '✅ Можно добавить' : '❌ Лимит достигнут'}
                    </span>
                </div>
            </div>

            {/* Зона загрузки */}
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
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />
                <div className={s.dropZoneContent}>
                    <span className={s.uploadIcon}>📸</span>
                    <p>Перетащите фото или кликните для выбора</p>
                    <p className={s.hint}>Максимум 10 фото за раз, до {max} всего</p>
                    {!canAdd && (
                        <p className={s.error}>⚠️ Достигнут лимит {max} фото. Удалите лишние.</p>
                    )}
                </div>
            </div>

            {uploading && <div className={s.uploading}>Загрузка...</div>}

            {/* Список фото */}
            {loading ? (
                <div className={s.loading}>Загрузка...</div>
            ) : (
                <div className={s.grid}>
                    {photos.map((photo) => (
                        <div key={photo.id} className={s.photoCard}>
                            <img src={photo.image_url} alt="Instagram" />
                            <div className={s.photoOverlay}>
                                <div className={s.photoInfo}>
                                    <span className={s.photoId}>ID: {photo.id}</span>
                                    <span className={`${s.status} ${photo.is_active ? s.active : s.inactive}`}>
                                        {photo.is_active ? 'Активно' : 'Скрыто'}
                                    </span>
                                </div>
                                <div className={s.photoActions}>
                                    <button 
                                        className={s.toggleBtn}
                                        onClick={() => handleToggle(photo.id)}
                                    >
                                        {photo.is_active ? 'Скрыть' : 'Показать'}
                                    </button>
                                    <button 
                                        className={s.deleteBtn}
                                        onClick={() => handleDelete(photo.id)}
                                    >
                                        <img src={deleteIconUrl} alt="delete" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {photos.length === 0 && !loading && (
                <div className={s.empty}>
                    <p>Нет загруженных фото</p>
                </div>
            )}
        </div>
    );
};

export default InstagramManager;