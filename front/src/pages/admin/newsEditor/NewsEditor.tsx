// src/pages/admin/newsEditor/NewsEditor.tsx

import React, { useEffect, useState, useRef } from 'react';
import { NewsBlock, NewsItem } from 'src/types/news';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import {
    getNewsItems,
    createNewsItem,
    updateNewsItem,
    deleteNewsItem,
    reorderNewsItems,
} from 'src/providers/adminNewsProvider';
import s from './style.module.css';

interface Props {
    block: NewsBlock;
    onClose: () => void;
    onUpdate: () => void;
}

const NewsEditor: React.FC<Props> = ({ block, onClose, onUpdate }) => {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        content: '',
        image_url: '',
        link_url: '',
        layout: 'horizontal' as 'horizontal' | 'vertical',
        sort_order: 0,
    });

    const loadItems = async () => {
        if (!block?.id) return;
        
        setLoading(true);
        try {
            const data = await getNewsItems(block.id);
            setItems(data);
        } catch (error) {
            console.error('Error loading news items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (block?.id) {
            loadItems();
        }
    }, [block?.id]);

    const resetForm = () => {
        setEditingItem(null);
        setImageFile(null);
        setImagePreview('');
        setFormData({
            content: '',
            image_url: '',
            link_url: '',
            layout: 'horizontal',
            sort_order: items.length,
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openCreateModal = () => {
        resetForm();
        setShowItemModal(true);
    };

    const openEditModal = (item: NewsItem) => {
        setEditingItem(item);
        setImageFile(null);
        setImagePreview(item.image_url || '');
        setFormData({
            content: item.content || '',
            image_url: item.image_url || '',
            link_url: item.link_url || '',
            layout: item.layout || 'horizontal',
            sort_order: item.sort_order,
        });
        setShowItemModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setImageFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setFormData(prev => ({
                ...prev,
                image_url: reader.result as string,
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
        setFormData(prev => ({
            ...prev,
            image_url: '',
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSaveItem = async () => {
        if (!block?.id) {
            alert('Блок не найден');
            return;
        }

        // Валидация
        if (!formData.content.trim() && !formData.image_url.trim() && !imageFile) {
            alert('Заполните текст или добавьте изображение');
            return;
        }

        setIsSubmitting(true);
        try {
            // 🔥 ЕСЛИ ЕСТЬ ФАЙЛ - ОТПРАВЛЯЕМ FORM-DATA
            if (imageFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('item_type', items.length === 0 && !editingItem ? 'header' : 'image');
                formDataToSend.append('content', formData.content || '');
                formDataToSend.append('link_url', formData.link_url || '');
                formDataToSend.append('layout', formData.layout || 'horizontal');
                formDataToSend.append('sort_order', String(formData.sort_order));
                formDataToSend.append('image', imageFile);

                if (editingItem?.id) {
                    await updateNewsItem(editingItem.id, formDataToSend);
                } else {
                    await createNewsItem(block.id, formDataToSend);
                }
            } else {
                // 🔥 БЕЗ ФАЙЛА - ОТПРАВЛЯЕМ JSON
                let itemType: 'header' | 'text' | 'image' = 'text';
                
                if (items.length === 0 && !editingItem) {
                    itemType = 'header';
                } else if (formData.image_url) {
                    itemType = 'image';
                } else {
                    itemType = 'text';
                }

                const dataToSend = {
                    item_type: itemType,
                    content: formData.content || null,
                    image_url: formData.image_url || null,
                    link_url: formData.link_url || null,
                    layout: formData.layout || null,
                    sort_order: formData.sort_order,
                };

                if (editingItem?.id) {
                    await updateNewsItem(editingItem.id, dataToSend);
                } else {
                    await createNewsItem(block.id, dataToSend);
                }
            }

            await loadItems();
            onUpdate();
            setShowItemModal(false);
            resetForm();
        } catch (error) {
            console.error('Save item error:', error);
            alert('Ошибка при сохранении элемента');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Удалить элемент?')) return;
        try {
            await deleteNewsItem(id);
            await loadItems();
            onUpdate();
        } catch (error) {
            console.error('Delete item error:', error);
        }
    };

    const renderItemPreview = (item: NewsItem) => {
        if (item.item_type === 'header') {
            return <h2 className={s.itemHeader}>{item.content}</h2>;
        }
        
        if (item.item_type === 'image') {
            return (
                <div className={s.itemImage}>
                    {item.image_url && (
                        <img src={item.image_url} alt={item.content || 'News image'} />
                    )}
                    {item.link_url && (
                        <span className={s.linkIndicator}>🔗 Ссылка: {item.link_url}</span>
                    )}
                </div>
            );
        }
        
        return <p className={s.itemText}>{item.content}</p>;
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            'header': '📌 Заголовок',
            'text': '📝 Текст',
            'image': '🖼️ Изображение'
        };
        return labels[type as keyof typeof labels] || type;
    };

    return (
        <div className={s.editorOverlay}>
            <div className={s.editorContainer}>
                <div className={s.editorHeader}>
                    <h3>📝 {block?.title || 'Редактор'}</h3>
                    <div className={s.editorActions}>
                        <Button text="+ Добавить элемент" onClick={openCreateModal} />
                        <button className={s.closeBtn} onClick={onClose}>✕</button>
                    </div>
                </div>

                {loading ? (
                    <div className={s.loader}>Загрузка элементов...</div>
                ) : items.length === 0 ? (
                    <div className={s.emptyState}>Нет элементов. Добавьте первый элемент!</div>
                ) : (
                    <div className={s.itemsList}>
                        {items.map((item) => (
                            <div key={item.id} className={s.itemCard}>
                                <div className={s.itemDragHandle}>⠿</div>
                                <div className={s.itemContent}>
                                    <div className={s.itemPreview}>
                                        {renderItemPreview(item)}
                                    </div>
                                    <div className={s.itemMeta}>
                                        <span className={s.typeTag}>{getTypeLabel(item.item_type)}</span>
                                        <span>Layout: {item.layout || 'horizontal'}</span>
                                        <span>Порядок: {item.sort_order}</span>
                                    </div>
                                </div>
                                <div className={s.itemActions}>
                                    <button
                                        className={s.editBtn}
                                        onClick={() => openEditModal(item)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className={s.deleteBtn}
                                        onClick={() => handleDeleteItem(item.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Модалка создания/редактирования */}
                <Modal active={showItemModal} onChange={setShowItemModal}>
                    <div onClick={(e) => e.stopPropagation()} className={s.modalContent}>
                        <div className={s.modalHeader}>
                            <h3>{editingItem ? 'Редактировать элемент' : 'Новый элемент'}</h3>
                            <button
                                className={s.closeBtn}
                                onClick={() => {
                                    setShowItemModal(false);
                                    resetForm();
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={s.hint}>
                            {items.length === 0 && !editingItem
                                ? '💡 Первый элемент будет заголовком' 
                                : '💡 Добавьте текст или загрузите изображение'}
                        </div>

                        <div className={s.formGroup}>
                            <label>Текст</label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    content: e.target.value,
                                })}
                                placeholder="Введите текст..."
                                className={s.textarea}
                                rows={3}
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>Изображение</label>
                            <div className={s.fileUpload}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={s.fileInput}
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className={s.fileLabel}>
                                    <span>📁 Выберите изображение</span>
                                </label>
                                {formData.image_url && (
                                    <button
                                        type="button"
                                        className={s.removeImage}
                                        onClick={removeImage}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {imagePreview && (
                                <div className={s.imagePreview}>
                                    <img src={imagePreview} alt="Preview" />
                                </div>
                            )}
                        </div>

                        <div className={s.formGroup}>
                            <label>Ссылка при клике (опционально)</label>
                            <input
                                type="text"
                                value={formData.link_url}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    link_url: e.target.value,
                                })}
                                placeholder="https://example.com"
                                className={s.input}
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>Ориентация</label>
                            <select
                                value={formData.layout}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    layout: e.target.value as any,
                                })}
                                className={s.select}
                            >
                                <option value="horizontal">Горизонтальная</option>
                                <option value="vertical">Вертикальная</option>
                            </select>
                        </div>

                        <div className={s.modalActions}>
                            <Button
                                text="Отмена"
                                onClick={() => {
                                    setShowItemModal(false);
                                    resetForm();
                                }}
                            />
                            <Button
                                text="Сохранить"
                                // loading={isSubmitting}
                                onClick={handleSaveItem}
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default NewsEditor;