// pages/admin/Banners/BannersManager.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react'
import Button from 'src/components/Button'
import s from "./style.module.css"
import { useAppDispatch } from 'src/store/hooks/redux'
import { getBanners, createAdminBanner, updateAdminBanner, deleteAdminBanner } from 'src/providers/adminBannersProvider'
import { finishLoading } from 'src/store/reducers/loadingSlice'
import Modal from 'src/components/modal/Modal';
import { Collection } from 'src/types/modules';
import deleteIconUrl from '/public/delete.svg';
import CollectionSelector from 'src/modules/admin/collectionSelector/CollectionSelector'
import CollectionForm from 'src/modules/admin/collectionForm/CollectionForm'
import { getCollections, createCollection } from 'src/providers/adminCollectionProvider';

interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
    sort_order: number;
    collection_id: number;
    created_at: string;
}

const BannersManager: React.FC = () => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showCollectionSelector, setShowCollectionSelector] = useState(false)
    const [showCollectionForm, setShowCollectionForm] = useState(false)
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [errors, setErrors] = useState<{ image?: boolean; collection?: boolean }>({})
    
    // Коллекции
    const [collections, setCollections] = useState<Collection[]>([])
    const [collectionsLoading, setCollectionsLoading] = useState(false)
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
    const [collectionsError, setCollectionsError] = useState<string | null>(null)
     const [title, setTitle] = useState<string>('')

    // Загрузка баннеров
    const loadBanners = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getBanners()
            setBanners(data)
        } catch (error) {
            console.error('Error loading banners:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Загрузка коллекций
    const loadCollections = useCallback(async () => {
        setCollectionsLoading(true)
        setCollectionsError(null)
        try {
            const data = await getCollections()
            setCollections(data)
        } catch (error) {
            console.error('Error loading collections:', error)
            setCollectionsError('Ошибка загрузки коллекций')
        } finally {
            setCollectionsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadBanners()
        loadCollections()
        dispatch(finishLoading())
    }, [loadBanners, loadCollections, dispatch])

    // Валидация
    const validateForm = (): boolean => {
        const newErrors: { image?: boolean; collection?: boolean } = {}

        if (!imageFile && !editingBanner?.image_url) {
            newErrors.image = true
        }

        if (!selectedCollection) {
            newErrors.collection = true
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Сохранение баннера
    const handleSaveBanner = async () => {
        if (!validateForm()) return

        setUploading(true)
        try {
            const bannerData = {
                image: imageFile,
                collection_id: selectedCollection?.id,
                active: true,
                title: title,
            }
            
            if (editingBanner) {
                await updateAdminBanner(editingBanner.id, bannerData)
            } else {
                await createAdminBanner(bannerData)
            }
            
            loadBanners()
            setShowModal(false)
            resetForm()
        } catch (error) {
            console.error('Error saving banner:', error)
            alert('Ошибка при сохранении')
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setImageFile(null)
        setImagePreview('')
        setSelectedCollection(null)
        setEditingBanner(null)
        setErrors({})
        setTitle("")
    }

    // Удаление баннера
    const handleDeleteBanner = async (id: number) => {
        if (!confirm('Удалить баннер?')) return
        try {
            await deleteAdminBanner(id)
            loadBanners()
        } catch (error) {
            console.error('Error deleting banner:', error)
        }
    }

    // ===== Сигналы для CollectionSelector =====
    
    // Выбор коллекции
    const handleSelectCollection = (collection: Collection) => {
        setSelectedCollection(collection)
        setShowCollectionSelector(false)
        setErrors(prev => ({ ...prev, collection: false }))
    }

    // Закрытие CollectionSelector
    const handleCloseSelector = () => {
        setShowCollectionSelector(false)
    }

    // ===== Сигналы для CollectionForm =====
    
    // Открытие формы создания коллекции
    const handleOpenCreateCollection = () => {
        setShowCollectionSelector(false)
        setShowCollectionForm(true)
    }

    // Сохранение коллекции
    const handleSaveCollection = async (data: any) => {
        try {
            const newCollection = await createCollection(data)
            await loadCollections()
            setSelectedCollection(newCollection)
            setShowCollectionForm(false)
            setErrors(prev => ({ ...prev, collection: false }))
        } catch (error) {
            console.error('Error creating collection:', error)
            alert('Ошибка при создании коллекции')
        }
    }

    // Отмена создания коллекции
    const handleCancelCollection = () => {
        setShowCollectionForm(false)
    }

    // Обработка выбора изображения
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, image: false }));
        }
        e.target.value = '';
    }

    // Открытие модалки
    const openModal = (banner?: Banner) => {
        setErrors({})
        
        if (banner) {
            setEditingBanner(banner)
            setImagePreview(banner.image_url)
            
            // Находим коллекцию по ID
            const collection = collections.find(c => c.id === banner.collection_id)
            setSelectedCollection(collection || null)
        } else {
            resetForm()
        }
        
        setShowModal(true)
    }

    const canAddMore = banners.length < 5

    // Получение названия коллекции для отображения
    const getCollectionDisplayName = (collectionId: number) => {
        const collection = collections.find(c => c.id === collectionId)
        return collection?.name || collection?.slug || 'Коллекция не найдена'
    }

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление баннерами</h2>
                <div className={s.headerButtons}>
                    {canAddMore && (
                        <Button className={s.addBannerBtn} text="+ Добавить баннер" onClick={() => openModal()} />
                    )}
                </div>
            </div>

            {!canAddMore && (
                <div className={s.limitWarning}>⚠️ Лимит 5 баннеров</div>
            )}

            <div className={s.bannersGrid}>
                {banners.map((banner) => (
                    <div key={banner.id} className={s.bannerCard}>
                        <div className={s.bannerImage}>
                            <img src={banner.image_url} alt={banner.title} />
                        </div>
                        <div className={s.bannerInfo}>
                            <h3>{banner.title || 'Баннер'}</h3>
                            {banner.link_url && (
                                <div className={s.bannerLink}>
                                    <a href={banner.link_url} target="_blank" rel="noopener noreferrer">
                                        {banner.link_url}
                                    </a>
                                </div>
                            )}
                            {banner.collection_id && (
                                <div className={s.bannerCollection}>
                                    📁 Коллекция: {getCollectionDisplayName(banner.collection_id)}
                                </div>
                            )}
                        </div>
                        <div className={s.bannerActions}>
                            <button onClick={() => openModal(banner)}>✏️</button>
                            <button onClick={() => handleDeleteBanner(banner.id)}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модалка редактирования баннера */}
            <Modal active={showModal} onChange={setShowModal}>
                <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                    <div className={s.modalHeader}>
                        <h3>{editingBanner ? 'Редактировать баннер' : 'Новый баннер'}</h3>
                        <button className={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                    </div>

                    {/* Заголовок */}
                    <div className={s.formGroup}>
                        <label>Заголовок</label>
                        <input
                            type="text"
                            value={title || ''}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Например: Летняя распродажа"
                            className={s.input}
                        />
                    </div>

                    {/* Изображение */}
                    <div className={s.formGroup}>
                        <label>Изображение <span className={s.required}>*</span></label>
                        <div className={`${s.imageUpload} ${errors.image ? s.errorBorder : ''}`}>
                            {imagePreview ? (
                                <div className={s.imagePreview}>
                                    <img src={imagePreview} alt="Preview" />
                                    <button
                                        className={s.deleteImageBtn}
                                        onClick={() => {
                                            setImagePreview('');
                                            setImageFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                    >
                                        <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        id="imageUpload"
                                        style={{
                                            position: 'absolute',
                                            opacity: 0,
                                            width: '100%',
                                            height: '100%',
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            top: 0,
                                            left: 0
                                        }}
                                    />
                                    <label
                                        htmlFor="imageUpload"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '30px',
                                            background: '#f5f5f5',
                                            border: '2px dashed #ccc',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            minHeight: '150px',
                                            color: '#666',
                                        }}
                                    >
                                        Выбрать изображение
                                    </label>
                                </div>
                            )}
                        </div>
                        {errors.image && <div className={s.errorText}>Изображение обязательно</div>}
                    </div>

                    {/* Коллекция */}
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

                    <div className={s.modalActions}>
                        <Button className={"btnStyle"} text="Отмена" onClick={() => setShowModal(false)} />
                        <Button
                            className={"btnStyle"}
                            text={uploading ? 'Сохранение...' : 'Сохранить'}
                            onClick={handleSaveBanner}
                            disabled={uploading}
                        />
                    </div>
                </div>

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
            </Modal>
        </div>
    )
}

export default BannersManager