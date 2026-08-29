// pages/admin/PromoCodes/PromoCodesManager.tsx
import React, { useEffect, useState, useCallback } from 'react';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import { useAppDispatch } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { Collection, PromoCode } from 'src/types/modules';
import s from './style.module.css';

// API функции
import {
    getPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
} from 'src/providers/adminPromoCodesProvider';

import {
    getCollections,
    createCollection,
} from 'src/providers/adminCollectionProvider';

// Компоненты
import CollectionSelector from 'src/modules/admin/collectionSelector/CollectionSelector';
import CollectionForm from 'src/modules/admin/collectionForm/CollectionForm';

const PromoCodesManager: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(finishLoading());
        }, 0);
        return () => clearTimeout(timer);
    }, [dispatch]);

    // Список промокодов
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);

    // Список коллекций
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);

    // Модалки
    const [showModal, setShowModal] = useState(false);
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);

    // Форма
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        discount_type: 'percent' as 'percent' | 'fixed',
        discount_value: 10,
        applies_to: 'global' as 'global' | 'collection',
        collection_id: null as number | null,
        min_order: null as number | null,
        max_order: null as number | null,
        max_discount: null as number | null,
        starts_at: '',
        ends_at: null as string | null,
        usage_limit: null as number | null,
        per_user_limit: null as number | null,
        is_active: true,
    });

    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [collectionsError, setCollectionsError] = useState<string | null>(null);

    // Загрузка всех промокодов
    const loadPromoCodes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPromoCodes();
            setPromoCodes(data);
        } catch (error) {
            console.error('Error loading promo codes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Загрузка коллекций
    const loadCollections = useCallback(async () => {
        setCollectionsLoading(true);
        setCollectionsError(null);
        try {
            const data = await getCollections();
            setCollections(data);
        } catch (error) {
            console.error('Error loading collections:', error);
            setCollectionsError('Ошибка загрузки коллекций');
        } finally {
            setCollectionsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPromoCodes();
        loadCollections();
    }, [loadPromoCodes, loadCollections]);

    // Валидация
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: boolean } = {};

        if (!formData.code.trim()) {
            newErrors.code = true;
        }
        if (!formData.name.trim()) {
            newErrors.name = true;
        }
        if (formData.discount_value <= 0) {
            newErrors.discount_value = true;
        }
        if (formData.applies_to === 'collection' && !formData.collection_id) {
            newErrors.collection = true;
        }
        if (!formData.starts_at) {
            newErrors.starts_at = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Сохранение
const handleSave = async () => {
    if (!validateForm()) return;

    // Преобразуем даты в ISO формат
    const startsAt = formData.starts_at ? new Date(formData.starts_at).toISOString() : '';
    const endsAt = formData.ends_at ? new Date(formData.ends_at).toISOString() : null;

    const data = {
        code: formData.code,
        name: formData.name,
        description: formData.description || '',
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        applies_to: formData.applies_to,
        collection_id: formData.applies_to === 'collection' ? formData.collection_id : null,
        min_order: formData.min_order || 0,
        max_order: formData.max_order || 0,
        max_discount: formData.max_discount || 0,
        starts_at: startsAt,
        ends_at: endsAt,
        usage_limit: formData.usage_limit || 0,
        per_user_limit: formData.per_user_limit || 0,
        is_active: formData.is_active,
    };

    try {
        if (editingPromoCode?.id) {
            await updatePromoCode(editingPromoCode.id, data);
        } else {
            await createPromoCode(data);
        }
        await loadPromoCodes();
        setShowModal(false);
        resetForm();
    } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка при сохранении');
    }
};

    const resetForm = () => {
        setEditingPromoCode(null);
        setFormData({
            code: '',
            name: '',
            description: '',
            discount_type: 'percent',
            discount_value: 10,
            applies_to: 'global',
            collection_id: null,
            min_order: null,
            max_order: null,
            max_discount: null,
            starts_at: '',
            ends_at: null,
            usage_limit: null,
            per_user_limit: null,
            is_active: true,
        });
        setSelectedCollection(null);
        setErrors({});
    };

    const openModal = (promoCode?: PromoCode) => {
        setErrors({});

        if (promoCode) {
            setEditingPromoCode(promoCode);
            setFormData({
                code: promoCode.code,
                name: promoCode.name || '',
                description: promoCode.description || '',
                discount_type: promoCode.discount_type,
                discount_value: promoCode.discount_value,
                applies_to: promoCode.applies_to,
                collection_id: promoCode.collection_id,
                min_order: promoCode.min_order,
                max_order: promoCode.max_order,
                max_discount: promoCode.max_discount,
                starts_at: promoCode.starts_at ? promoCode.starts_at.split('T')[0] : '',
                ends_at: promoCode.ends_at ? promoCode.ends_at.split('T')[0] : null,
                usage_limit: promoCode.usage_limit,
                per_user_limit: promoCode.per_user_limit,
                is_active: promoCode.is_active,
            });

            if (promoCode.collection_id) {
                const collection = collections.find(c => c.id === promoCode.collection_id);
                setSelectedCollection(collection || null);
            } else {
                setSelectedCollection(null);
            }
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить промокод?')) return;
        try {
            await deletePromoCode(id);
            await loadPromoCodes();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Выбор коллекции
    const handleSelectCollection = (collection: Collection) => {
        setSelectedCollection(collection);
        setFormData(prev => ({ ...prev, collection_id: collection.id }));
        setShowCollectionSelector(false);
        setErrors(prev => ({ ...prev, collection: false }));
    };

    const handleCloseSelector = () => {
        setShowCollectionSelector(false);
    };

    // Создание коллекции
    const handleOpenCreateCollection = () => {
        setShowCollectionSelector(false);
        setShowCollectionForm(true);
    };

    const handleSaveCollection = async (data: any) => {
        try {
            const newCollection = await createCollection(data);
            await loadCollections();
            setSelectedCollection(newCollection);
            setFormData(prev => ({ ...prev, collection_id: newCollection.id }));
            setShowCollectionForm(false);
            setErrors(prev => ({ ...prev, collection: false }));
        } catch (error) {
            console.error('Error creating collection:', error);
            alert('Ошибка при создании коллекции');
        }
    };

    const handleCancelCollection = () => {
        setShowCollectionForm(false);
    };

    // Получение названия коллекции
    const getCollectionDisplayName = useCallback((collectionId: number | null) => {
        if (!collectionId) return 'Не выбрана';
        const collection = collections.find(c => c.id === collectionId);
        return collection?.name || collection?.slug || 'Не выбрана';
    }, [collections]);

    // Форматирование даты
    const formatDate = (date: string) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('ru-RU');
        } catch {
            return date;
        }
    };

    // Форматирование типа скидки
    const formatDiscount = (promoCode: PromoCode) => {
        if (promoCode.discount_type === 'percent') {
            return `${promoCode.discount_value}%`;
        }
        return `${(promoCode.discount_value)} ₽`;
    };

    return (

        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление промокодами</h2>
                <Button text="+ Добавить промокод" onClick={() => openModal()} />
            </div>

            {loading ? (
                <div className={s.loader}>Загрузка...</div>
            ) : promoCodes.length === 0 ? (
                <div className={s.emptyState}>Нет промокодов. Создайте первый промокод!</div>
            ) : (
                <div className={s.codesGrid}>
                    {promoCodes.map((promoCode) => (
                        <div key={promoCode.id} className={`${s.codeCard} ${!promoCode.is_active ? s.inactive : ''}`}>
                            <div className={s.codeHeader}>
                                <span className={s.codeBadge}>{promoCode.code}</span>
                                <span className={promoCode.is_active ? s.active : s.inactive}>
                                    {promoCode.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                            </div>
                            <h3 className={s.codeTitle}>{promoCode.name}</h3>
                            <div className={s.codeMeta}>
                                <span>Скидка: <strong>{formatDiscount(promoCode)}</strong></span>
                                <span>Тип: {promoCode.applies_to === 'global' ? '🌍 Весь заказ' : '📁 По коллекции'}</span>
                            </div>
                            {promoCode.applies_to === 'collection' && (
                                <div className={s.codeCollection}>
                                    📁 Коллекция: {getCollectionDisplayName(promoCode.collection_id)}
                                </div>
                            )}
                            <div className={s.codeDates}>
                                <span>Действует: {formatDate(promoCode.starts_at)}</span>
                                {promoCode.ends_at && <span>до {formatDate(promoCode.ends_at)}</span>}
                            </div>
                            <div className={s.codeUsage}>
                                Использований: <strong>{promoCode.usage_count || 0}</strong>
                                {promoCode.usage_limit ? ` / ${promoCode.usage_limit}` : ' (безлимитный)'}
                            </div>
                            <div className={s.codeActions}>
                                <button className={s.editBtn} onClick={() => openModal(promoCode)}>✏️ Редактировать</button>
                                <button className={s.deleteBtn} onClick={() => handleDelete(promoCode.id!)}>🗑️ Удалить</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Модалка редактирования промокода */}
            <Modal active={showModal} onChange={setShowModal}>
                <div onClick={e => e.stopPropagation()} className={s.modalContent}>
                    <div className={s.modalHeader}>
                        <h3>{editingPromoCode ? 'Редактировать промокод' : 'Новый промокод'}</h3>
                        <button className={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                    </div>

                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label>Код промокода <span className={s.required}>*</span></label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                placeholder="SUMMER2026"
                                className={`${s.input} ${errors.code ? s.errorBorder : ''}`}
                                disabled={!!editingPromoCode}
                            />
                            {errors.code && <div className={s.errorText}>Введите код промокода</div>}
                        </div>

                        <div className={s.formGroup}>
                            <label>Название <span className={s.required}>*</span></label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Летняя распродажа"
                                className={`${s.input} ${errors.name ? s.errorBorder : ''}`}
                            />
                            {errors.name && <div className={s.errorText}>Введите название</div>}
                        </div>
                    </div>

                    <div className={s.formGroup}>
                        <label>Описание</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Описание промокода"
                            className={s.input}
                        />
                    </div>

                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label>Тип скидки <span className={s.required}>*</span></label>
                            <select
                                value={formData.discount_type}
                                onChange={e => setFormData(prev => ({ ...prev, discount_type: e.target.value as 'percent' | 'fixed' }))}
                                className={s.select}
                            >
                                <option value="percent">Процент (%)</option>
                                <option value="fixed">Фиксированная (₽)</option>
                            </select>
                        </div>

                        <div className={s.formGroup}>
                            <label>Значение скидки <span className={s.required}>*</span></label>
                            <input
                                type="number"
                                value={formData.discount_value}
                                onChange={e => setFormData(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
                                className={`${s.input} ${errors.discount_value ? s.errorBorder : ''}`}
                                min={1}
                            />
                            {errors.discount_value && <div className={s.errorText}>Введите значение скидки</div>}
                        </div>
                    </div>

                    <div className={s.formGroup}>
                        <label>Применение <span className={s.required}>*</span></label>
                        <select
                            value={formData.applies_to}
                            onChange={e => {
                                const value = e.target.value as 'global' | 'collection';
                                setFormData(prev => ({
                                    ...prev,
                                    applies_to: value,
                                    collection_id: value === 'global' ? null : prev.collection_id
                                }));
                                if (value === 'global') {
                                    setSelectedCollection(null);
                                }
                            }}
                            className={s.select}
                        >
                            <option value="global">🌍 На весь заказ</option>
                            <option value="collection">📁 На коллекцию</option>
                        </select>
                    </div>

                    {formData.applies_to === 'collection' && (
                        <div className={s.formGroup}>
                            <label>Коллекция <span className={s.required}>*</span></label>
                            <div
                                className={`${s.collectionSelector} ${errors.collection ? s.errorBorder : ''}`}
                                onClick={() => setShowCollectionSelector(true)}
                            >
                                <div className={s.collectionDisplay}>
                                    {selectedCollection?.name || selectedCollection?.slug || 'Выберите коллекцию'}
                                </div>
                                <span className={s.editHint}>✏️ нажмите чтобы выбрать</span>
                            </div>
                            {errors.collection && <div className={s.errorText}>Выберите коллекцию</div>}
                        </div>
                    )}

                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label>Минимальная сумма заказа (коп.)</label>
                            <input
                                type="number"
                                value={formData.min_order || ''}
                                onChange={e => setFormData(prev => ({ ...prev, min_order: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="Например: 50000"
                                className={s.input}
                                min={0}
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>Максимальная сумма заказа (коп.)</label>
                            <input
                                type="number"
                                value={formData.max_order || ''}
                                onChange={e => setFormData(prev => ({ ...prev, max_order: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="0 = без ограничений"
                                className={s.input}
                                min={0}
                            />
                        </div>
                    </div>

                    <div className={s.formGroup}>
                        <label>Максимальная сумма скидки (коп.)</label>
                        <input
                            type="number"
                            value={formData.max_discount || ''}
                            onChange={e => setFormData(prev => ({ ...prev, max_discount: e.target.value ? parseInt(e.target.value) : null }))}
                            placeholder="0 = без ограничений"
                            className={s.input}
                            min={0}
                        />
                    </div>

                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label>Дата начала <span className={s.required}>*</span></label>
                            <input
                                type="date"
                                value={formData.starts_at}
                                onChange={e => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                                className={`${s.input} ${errors.starts_at ? s.errorBorder : ''}`}
                            />
                            {errors.starts_at && <div className={s.errorText}>Выберите дату начала</div>}
                        </div>

                        <div className={s.formGroup}>
                            <label>Дата окончания</label>
                            <input
                                type="date"
                                value={formData.ends_at || ''}
                                onChange={e => setFormData(prev => ({ ...prev, ends_at: e.target.value || null }))}
                                className={s.input}
                                min={formData.starts_at}
                            />
                        </div>
                    </div>

                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label>Лимит использований</label>
                            <input
                                type="number"
                                value={formData.usage_limit || ''}
                                onChange={e => setFormData(prev => ({ ...prev, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="0 = безлимитный"
                                className={s.input}
                                min={0}
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>На одного пользователя</label>
                            <input
                                type="number"
                                value={formData.per_user_limit || ''}
                                onChange={e => setFormData(prev => ({ ...prev, per_user_limit: e.target.value ? parseInt(e.target.value) : null }))}
                                placeholder="0 = без ограничений"
                                className={s.input}
                                min={0}
                            />
                        </div>
                    </div>

                    <div className={s.formGroup}>
                        <label className={s.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                            />
                            Промокод активен
                        </label>
                    </div>

                    <div className={s.modalActions}>
                        <Button text="Отмена" onClick={() => setShowModal(false)} />
                        <Button text="Сохранить" onClick={handleSave} />
                    </div>
                </div>
            </Modal>

            {/* Модалка выбора коллекции */}
            {showCollectionSelector && (
                <div className={s.modalOverlay} onClick={() => setShowCollectionSelector(false)}>
                    <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Выберите коллекцию</h3>
                            <button onClick={() => setShowCollectionSelector(false)}>✕</button>
                        </div>

                        <CollectionSelector
                            collections={collections}
                            loading={collectionsLoading}
                            selectedId={selectedCollection?.id}
                            onSelect={handleSelectCollection}
                            onClose={handleCloseSelector}
                        />

                        <div className={s.modalFooter}>
                            <Button text="+ Создать коллекцию" onClick={handleOpenCreateCollection} />
                            <Button text="Закрыть" onClick={() => setShowCollectionSelector(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка создания коллекции */}
            {showCollectionForm && (
                <div className={s.modalOverlay} onClick={() => setShowCollectionForm(false)}>
                    <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Создать коллекцию</h3>
                            <button onClick={() => setShowCollectionForm(false)}>✕</button>
                        </div>

                        <CollectionForm
                            initialData={null}
                            onSave={handleSaveCollection}
                            onCancel={handleCancelCollection}
                            onClose={() => setShowCollectionForm(false)}
                        />
                    </div>
                </div>
            )}
        </div>

    );
};

export default PromoCodesManager;