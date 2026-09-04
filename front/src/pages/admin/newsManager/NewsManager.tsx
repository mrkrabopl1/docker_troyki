// pages/admin/News/NewsBlocksManager.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { NewsBlock } from 'src/types/news';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import {
    getNewsBlocks,
    createNewsBlock,
    updateNewsBlock,
    deleteNewsBlock,
    reorderNewsBlocks,
} from 'src/providers/adminNewsProvider';
import NewsBlockEditor from 'src/pages/admin/newsEditor/NewsEditor';
import s from './style.module.css';

const NewsBlocksManager: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(finishLoading());
    }, [dispatch]);

    const [blocks, setBlocks] = useState<NewsBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBlock, setEditingBlock] = useState<NewsBlock | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<NewsBlock | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Для загрузки изображения обложки
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>('');
    const [coverImageUrl, setCoverImageUrl] = useState<string>(''); // сохраненный URL
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadBlocks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNewsBlocks();
            setBlocks(data);
        } catch (error) {
            console.error('Error loading news blocks:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBlocks();
    }, [loadBlocks]);

    // Обработчик выбора файла для обложки
    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Размер изображения не должен превышать 5MB');
            return;
        }

        setCoverImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // 🔥 РЕАЛЬНАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЯ НА СЕРВЕР
    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);

        // TODO: Заменить на реальный эндпоинт
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.url; // URL загруженного изображения
    };

    const handleSave = async () => {
        const title = (document.getElementById('block-title') as HTMLInputElement).value;
        const coverAltText = (document.getElementById('cover-alt-text') as HTMLInputElement).value;
        const publishedAt = (document.getElementById('published-at') as HTMLInputElement).value;
        const isActive = (document.getElementById('block-active') as HTMLInputElement).checked;

        if (!title.trim()) {
            alert('Введите название блока');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingBlock?.id) {
                // 🔥 ОБНОВЛЕНИЕ
                if (coverImageFile) {
                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('cover_alt_text', coverAltText || '');
                    formData.append('is_active', String(isActive));
                    formData.append('published_at', publishedAt || '');
                    formData.append('sort_order', String(editingBlock.sort_order || blocks.length));
                    formData.append('image', coverImageFile);

                    await updateNewsBlock(editingBlock.id, formData);
                } else {
                    await updateNewsBlock(editingBlock.id, {
                        title,
                        cover_alt_text: coverAltText || null,
                        is_active: isActive,
                        published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
                        sort_order: editingBlock.sort_order || blocks.length,
                    });
                }
            } else {
                // 🔥 СОЗДАНИЕ
                const formData = new FormData();
                formData.append('title', title);
                formData.append('cover_alt_text', coverAltText || '');
                formData.append('is_active', String(isActive));
                formData.append('published_at', publishedAt || '');
                formData.append('sort_order', String(blocks.length));

                if (coverImageFile) {
                    formData.append('image', coverImageFile);
                }

                await createNewsBlock(formData);
            }

            await loadBlocks();
            setShowModal(false);
            setEditingBlock(null);
            resetCoverImage();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Ошибка при сохранении');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetCoverImage = () => {
        setCoverImageFile(null);
        setCoverImagePreview('');
        setCoverImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить блок новостей? Все элементы внутри тоже будут удалены.')) return;
        try {
            await deleteNewsBlock(id);
            await loadBlocks();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleToggleActive = async (block: NewsBlock) => {
        try {
            await updateNewsBlock(block.id, {
                is_active: !block.is_active
            });
            await loadBlocks();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Ошибка при изменении статуса');
        }
    };

    const openModal = (block?: NewsBlock) => {
        setEditingBlock(block || null);
        setCoverImagePreview(block?.cover_image_url || '');
        setCoverImageUrl(block?.cover_image_url || '');
        setShowModal(true);
    };

    const openEditor = (block: NewsBlock) => {
        setSelectedBlock(block);
    };

    const closeEditor = () => {
        setSelectedBlock(null);
        loadBlocks();
    };

    const removeCoverImage = () => {
        setCoverImageFile(null);
        setCoverImagePreview('');
        setCoverImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление новостными блоками</h2>
                <Button
                    text="+ Добавить блок"
                    onClick={() => openModal()}
                />
            </div>

            {loading ? (
                <div className={s.loader}>Загрузка...</div>
            ) : blocks.length === 0 ? (
                <div className={s.emptyState}>Нет новостных блоков. Создайте первый блок!</div>
            ) : (
                <div className={s.blocksGrid}>
                    {blocks.map((block) => (
                        <div key={block.id} className={`${s.blockCard} ${!block.is_active ? s.inactive : ''}`}>
                            <div className={s.blockInfo}>
                                <div className={s.blockHeader}>
                                    <h3 className={s.blockTitle}>{block.title}</h3>
                                    <span className={block.is_active ? s.activeBadge : s.inactiveBadge}>
                                        {block.is_active ? 'Активен' : 'Неактивен'}
                                    </span>
                                </div>
                                {block.cover_image_url && (
                                    <div className={s.coverPreview}>
                                        <img src={block.cover_image_url} alt={block.cover_alt_text || block.title} />
                                    </div>
                                )}
                                <div className={s.blockMeta}>
                                    <span>Порядок: {block.sort_order}</span>
                                    <span>👁️ {block.views_count}</span>
                                    <span>❤️ {block.likes_count}</span>
                                    <span>📅 {new Date(block.published_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className={s.blockActions}>
                                <button
                                    className={s.toggleBtn}
                                    onClick={() => handleToggleActive(block)}
                                >
                                    {block.is_active ? '⏸️ Деактивировать' : '▶️ Активировать'}
                                </button>
                                <button className={s.editBtn} onClick={() => openModal(block)}>
                                    ✏️ Редактировать
                                </button>
                                <button className={s.contentBtn} onClick={() => openEditor(block)}>
                                    📝 Контент
                                </button>
                                <button
                                    className={s.deleteBtn}
                                    onClick={() => handleDelete(block.id!)}
                                >
                                    🗑️ Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модалка создания/редактирования блока */}
            <Modal active={showModal} onChange={setShowModal}>
                <div onClick={(e) => e.stopPropagation()} className={s.modalContent}>
                    <div className={s.modalHeader}>
                        <h3>{editingBlock ? 'Редактировать блок' : 'Новый блок новостей'}</h3>
                        <button className={s.closeBtn} onClick={() => {
                            setShowModal(false);
                            setEditingBlock(null);
                            resetCoverImage();
                        }}>✕</button>
                    </div>

                    <div className={s.formGroup}>
                        <label>Название блока <span className={s.required}>*</span></label>
                        <input
                            type="text"
                            defaultValue={editingBlock?.title || ''}
                            id="block-title"
                            placeholder="Новости недели, Спецпредложения..."
                            className={s.input}
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label>Обложка блока</label>
                        <div className={s.fileUpload}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverFileChange}
                                className={s.fileInput}
                                id="cover-upload"
                            />
                            <label htmlFor="cover-upload" className={s.fileLabel}>
                                <span>📁 Выберите изображение</span>
                            </label>
                            {(coverImagePreview || coverImageUrl) && (
                                <button
                                    type="button"
                                    className={s.removeImage}
                                    onClick={removeCoverImage}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {(coverImagePreview || coverImageUrl) && (
                            <div className={s.imagePreview}>
                                <img
                                    src={coverImagePreview || coverImageUrl}
                                    alt="Preview"
                                />
                            </div>
                        )}
                    </div>

                    <div className={s.formGroup}>
                        <label>Alt текст для обложки</label>
                        <input
                            type="text"
                            defaultValue={editingBlock?.cover_alt_text || ''}
                            id="cover-alt-text"
                            placeholder="Описание изображения"
                            className={s.input}
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label>Дата публикации</label>
                        <input
                            type="datetime-local"
                            defaultValue={editingBlock?.published_at ? new Date(editingBlock.published_at).toISOString().slice(0, 16) : ''}
                            id="published-at"
                            className={s.input}
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label className={s.checkboxLabel}>
                            <input
                                type="checkbox"
                                defaultChecked={editingBlock?.is_active ?? true}
                                id="block-active"
                            />
                            Блок активен
                        </label>
                    </div>

                    <div className={s.modalActions}>
                        <Button text="Отмена" onClick={() => {
                            setShowModal(false);
                            setEditingBlock(null);
                            resetCoverImage();
                        }} />
                        <Button
                            text="Сохранить"
                            // loading={isSubmitting}
                            onClick={() => {
                                const title = (document.getElementById('block-title') as HTMLInputElement).value;
                               

                                if (!title.trim()) {
                                    alert('Введите название блока');
                                    return;
                                }

                                handleSave();
                            }}
                        />
                    </div>
                </div>
            </Modal>

            {/* Редактор контента блока */}
            {selectedBlock && (
                <NewsBlockEditor
                    block={selectedBlock}
                    onClose={closeEditor}
                    onUpdate={loadBlocks}
                />
            )}
        </div>
    );
};

export default NewsBlocksManager;