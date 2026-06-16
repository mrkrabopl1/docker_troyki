import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import BrandLinesManager from 'src/modules/admin/brandLinesManager/BrandLinesManager';
import { ReactComponent as EditIcon } from '/public/edit.svg';
import { ReactComponent as SaveIcon } from '/public/save.svg';
import { ReactComponent as CancelIcon } from '/public/cancel.svg';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';
import {
    getBrandData,
    updateBrandData,
    uploadTempImage
} from 'src/providers/adminProductsProvider';

const BrandDetails: React.FC = () => {
    const router = useRouter();
    const { brandId } = router.query;
    const dispatch = useAppDispatch();
    const [brand, setBrand] = useState<any>(null);
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLineModal, setShowLineModal] = useState(false);
    const [selectedLine, setSelectedLine] = useState<any>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        country: '',
        founded_year: '',
        website: '',
        description: '',
        sort_order: 0,
        image_path: ''
    });
    const [editImagePreview, setEditImagePreview] = useState('');

    const sessionId = useMemo(() => {
        return `brand_${brandId}_${Date.now()}`;
    }, [brandId]);

    const categoryIcons: Record<string, string> = {
        sneakers: '👟', merch: '👕', clothes: '🧥', toys: '🧸'
    };

    const categoryNames: Record<string, string> = {
        sneakers: 'Кроссовки', merch: 'Мерч', clothes: 'Одежда', toys: 'Игрушки'
    };

    const loadData = useCallback(async () => {
        if (!brandId) return;
        setLoading(true);
        getBrandData(parseInt(brandId as string), (data: any) => {
            
            setBrand(data);
            setLines(data.lines || []);
            setEditForm({
                name: data.name || '',
                country: data.country || '',
                founded_year: data.founded_year || '',
                website: data.website || '',
                description: data.description || '',
                sort_order: data.sort_order || 0,
                image_path: data.image_path || ''
            });
            setEditImagePreview(data.image_path || '');
            setLoading(false);
            dispatch(finishLoading());
        });

    }, [brandId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEditClick = () => setIsEditing(true);

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm({
            name: brand?.name || '',
            country: brand?.country || '',
            founded_year: brand?.founded_year || '',
            website: brand?.website || '',
            description: brand?.description || '',
            sort_order: brand?.sort_order || 0,
            image_path: brand?.image_path || ''
        });
        setEditImagePreview(brand?.image_path || '');
        setImageUploading(false);
    };

    const handleSaveEdit = async () => {
        setFormLoading(true);
        try {
            const payload = {
                id: brand.id,
                name: editForm.name,
                country: editForm.country || undefined,
                founded_year: editForm.founded_year ? Number(editForm.founded_year) : undefined,
                website: editForm.website || undefined,
                description: editForm.description || undefined,
                sort_order: editForm.sort_order,
                image_path: editForm.image_path || undefined,
                session_id: sessionId
            };
            await updateBrandData(brand.id, payload);
            await loadData();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating brand:', error);
            alert('Ошибка при обновлении бренда');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEditFieldChange = (field: string, value: string | number) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setEditImagePreview(previewUrl);
        setImageUploading(true);
        try {
            await uploadTempImage(sessionId, file, (response: any) => {
                const uploadedPath = response.images[0];
                setEditForm(prev => ({ ...prev, image_path: uploadedPath }));
                setEditImagePreview(uploadedPath);
            });
        } catch (error) {
            console.error('Image upload failed', error);
            setEditImagePreview(editForm.image_path || brand?.image_path || '');
        } finally {
            setImageUploading(false);
            e.target.value = '';
        }
    };

    const getSeasonName = (season: string): string => {
        const seasons: Record<string, string> = {
            'spring': 'Весна', 'summer': 'Лето', 'autumn': 'Осень', 'winter': 'Зима',
            'spring-summer': 'Весна-Лето', 'autumn-winter': 'Осень-Зима'
        };
        return seasons[season] || season;
    };

    if (loading) {
        return (
            <div className={s.container}>
                <div className={s.loading}>Загрузка...</div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className={s.container}>
                <div className={s.error}>Бренд не найден</div>
                <Button text="← Назад к списку" onClick={() => router.push('/admin/brands')} />
            </div>
        );
    }

    return (
        <div className={s.container}>
            <div className={s.breadcrumbs}>
                <span onClick={() => router.push('/admin')}>Админ</span>
                <span className={s.separator}>/</span>
                <span onClick={() => router.push('/admin/brands')}>Бренды</span>
                <span className={s.separator}>/</span>
                <span className={s.current}>{brand.name}</span>
            </div>

            <div className={s.header}>
                <div className={s.titleSection}>
                    <h2>{brand.name}</h2>
                    <span className={`${s.statusBadge} ${brand.is_active ? s.active : s.inactive}`}>
                        {brand.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                </div>
                <div className={s.headerActions}>
                    {!isEditing ? (
                        <>
                            <Button text="Редактировать бренд" onClick={handleEditClick} />
                            <Button text="← Назад к списку" onClick={() => router.push('/admin/brands')} />
                        </>
                    ) : (
                        <>
                            <Button text="Сохранить" onClick={handleSaveEdit} disabled={formLoading || imageUploading} />
                            <Button text="Отмена" onClick={handleCancelEdit} disabled={formLoading || imageUploading} />
                        </>
                    )}
                </div>
            </div>

            {!isEditing ? (
                <div className={s.brandInfoCard}>
                    <div className={s.brandMainInfo}>
                        {brand.image_path ? (
                            <img src={brand.image_path} alt={brand.name} className={s.brandLogo} />
                        ) : (
                            <div className={s.noLogo}>Нет логотипа</div>
                        )}
                        <div className={s.brandDetails}>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Страна:</span>
                                <span className={s.detailValue}>{brand.country || '—'}</span>
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Год основания:</span>
                                <span className={s.detailValue}>{brand.founded_year || '—'}</span>
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Веб-сайт:</span>
                                {brand.website ? (
                                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className={s.websiteLink}>
                                        {brand.website.replace(/^https?:\/\//, '')}
                                    </a>
                                ) : (
                                    <span className={s.detailValue}>—</span>
                                )}
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Порядок сортировки:</span>
                                <span className={s.detailValue}>{brand.sort_order}</span>
                            </div>
                        </div>
                    </div>
                    {brand.description && (
                        <div className={s.brandDescription}>
                            <h4>Описание</h4>
                            <p>{brand.description}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className={s.brandInfoCardEdit}>
                    <div className={s.brandMainInfo}>
                        <div className={s.editImageSection}>
                            {imageUploading && <div className={s.uploading}>Загрузка логотипа...</div>}
                            {editImagePreview ? (
                                <div className={s.editImageContainer}>
                                    <img src={editImagePreview} alt="Brand preview" className={s.brandLogo} />
                                    <label className={s.changeImageBtn}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleEditImageChange}
                                            disabled={imageUploading}
                                            style={{ display: 'none' }}
                                        />
                                        Сменить фото
                                    </label>
                                </div>
                            ) : (
                                <label className={s.uploadImagePlaceholder}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageChange}
                                        disabled={imageUploading}
                                    />
                                    Загрузить логотип
                                </label>
                            )}
                        </div>
                        <div className={s.brandDetails}>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Название бренда:</span>
                                <input type="text" value={editForm.name} onChange={(e) => handleEditFieldChange('name', e.target.value)} placeholder="Название бренда" />
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Страна:</span>
                                <input type="text" value={editForm.country} onChange={(e) => handleEditFieldChange('country', e.target.value)} placeholder="Страна" />
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Год основания:</span>
                                <input type="number" value={editForm.founded_year} onChange={(e) => handleEditFieldChange('founded_year', e.target.value)} placeholder="Год" />
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Веб-сайт:</span>
                                <input type="url" value={editForm.website} onChange={(e) => handleEditFieldChange('website', e.target.value)} placeholder="https://" />
                            </div>
                            <div className={s.detailRow}>
                                <span className={s.detailLabel}>Порядок сортировки:</span>
                                <input type="number" value={editForm.sort_order} onChange={(e) => handleEditFieldChange('sort_order', parseInt(e.target.value))} placeholder="Порядок" />
                            </div>
                        </div>
                    </div>
                    <div className={s.brandDescription}>
                        <h4>Описание</h4>
                        <textarea value={editForm.description} onChange={(e) => handleEditFieldChange('description', e.target.value)} placeholder="Описание бренда" rows={4} />
                    </div>
                </div>
            )}

            <div className={s.statsSection}>
                <h3>Статистика товаров</h3>
                <div className={s.statsGrid}>
                    <div className={s.statCard}>
                        <span className={s.statValue}>{brand.total_products}</span>
                        <span className={s.statLabel}>Всего товаров</span>
                    </div>
                    <div className={`${s.statCard} ${s.active}`}>
                        <span className={s.statValue}>{brand.active_products}</span>
                        <span className={s.statLabel}>На витрине</span>
                    </div>
                    <div className={`${s.statCard} ${s.inactive}`}>
                        <span className={s.statValue}>{brand.inactive_products}</span>
                        <span className={s.statLabel}>Скрыто</span>
                    </div>
                    <div className={s.statCard}>
                        <span className={s.statValue}>{lines.length}</span>
                        <span className={s.statLabel}>Линеек</span>
                    </div>
                </div>
                <div className={s.categoryStats}>
                    <h4>По категориям</h4>
                    <div className={s.categoryGrid}>
                        {(['sneakers', 'merch', 'clothes', 'toys'] as const).map(cat => {
                            const total = brand[`${cat}_count`] || 0;
                            const active = brand[`${cat}_active`] || 0;
                            return (
                                <div key={cat} className={s.categoryCard}>
                                    <div className={s.categoryHeader}>
                                        <span className={s.categoryIcon}>{categoryIcons[cat]}</span>
                                        <span className={s.categoryName}>{categoryNames[cat]}</span>
                                    </div>
                                    <div className={s.categoryProgress}>
                                        <div className={s.progressBar} style={{ width: total > 0 ? `${(active / total) * 100}%` : '0%' }} />
                                    </div>
                                    <div className={s.categoryNumbers}>
                                        <span className={s.activeCount}>{active}</span>
                                        <span className={s.separator}>/</span>
                                        <span className={s.totalCount}>{total}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={s.linesSection}>
                <h3>Линейки и коллекции</h3>
                <BrandLinesManager lines={lines} mode="manage" loading={loading} showStats={true} />
            </div>
        </div>
    );
};

export default BrandDetails;