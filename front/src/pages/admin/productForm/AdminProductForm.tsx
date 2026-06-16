// pages/admin/ProductForm/AdminProductForm.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from 'src/store/hooks/redux';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import Scroller from 'src/components/scroller/Scroller';
import TableWithComboboxColumn from 'src/components/table/simpleTable/TableWithComboboxColumn';
import Combobox from 'src/components/combobox/Combobox';
import ComboboxWithSearch from 'src/components/combobox/ComboboxWithSearch';
import { getSizeTable } from "src/providers/merchProvider";
import { ProductFormData } from 'src/types/adminProduct';
import { useAppDispatch } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice'
import FirmForm from 'src/modules/admin/firmForm/FirmForm';
import {
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    uploadProductImage,
    deleteProductImage,
    createFirm,
    getBrandsWithLines,
    deleteAdminProduct,
    uploadTempImage
} from 'src/providers/adminProductsProvider';
import s from './style.module.css';
import { ReactComponent as AddIcon } from '/public/add.svg';
import { ReactComponent as UploadIcon } from '/public/upload.svg';
import deleteIconUrl from '/public/delete.svg';
import NumInput from 'src/components/input/NumInput';
import Input from 'src/components/input/Input';
import InputWithLabelWithValidation from 'src/components/input/InputWithLabelWithValidation';
import Checkbox from 'src/components/checkbox/Checkbox';

interface SizePrice {
    size: string;
    price: number;
    discount?: number;
    quantity?: number;
}

const AdminProductForm: React.FC = () => {
   const router = useRouter();
    const { id } = router.query;
    const isEdit = !!id && id !== 'create';
    const { typesVal, categories, firms, firmMap, collections } = useAppSelector(state => state.menuReducer);
    const { user } = useAppSelector(state => state.adminReducer);
    const dispatch = useAppDispatch();
    // Фильтруем доступные статусы в зависимости от роли
    const availableStatuses = useMemo(() => {
        const allStatuses = {
            draft: 'Черновик',
            active: 'Активен (на витрине)',
            inactive: 'Архивирован'
        };

        // Admin не может перевести в active (на витрину)
        if (user?.role !== 'superadmin') {
            const { active, ...rest } = allStatuses;
            return rest; // только draft и inactive
        }

        return allStatuses; // superadmin может всё
    }, [user?.role])
    const sessionId = useMemo(() => {
        if (!isEdit) {
            return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return '';
    }, [isEdit]);

    // --- Состояние формы ---
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        article: '',
        firm: "",
        line: "",
        category_id: 0,
        type_id: 0,
        bodytype: 'man',
        description: '',
        sizes: [],
        images: [],
        image_count: 0,
        status: 'draft',
        info: ""
    });

    // --- Валидация ---
    const [checkValid, setCheckValid] = useState(false);      // триггер показа ошибок после попытки отправки
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [fieldServerErrors, setFieldServerErrors] = useState<Record<string, string>>({});

    // --- Brand / Line ---
    const [selectedBrandId, setSelectedBrandId] = useState<number>(-1);
    const [selectedLineName, setSelectedLineName] = useState<string>('');

    // Данные для комбобоксов
    const brandsData = useMemo(() => {
        return firms.reduce((acc, name) => {
            const id = firmMap[name];
            if (id) acc[id] = name;
            return acc;
        }, {} as Record<number, string>);
    }, [firms, firmMap]);

    const linesData = useMemo(() => {
        return collections[brandsData[selectedBrandId]]
    }, [collections, selectedBrandId]);

    const categoriesComboboxData = useMemo(() => {
        return Object.values(categories).reduce((acc, cat: any) => {
            acc[cat.id] = cat.category_name;
            return acc;
        }, {} as Record<number, string>);
    }, [categories]);

    const typesComboboxData = useMemo(() => {
        const categoryName = Object.values(categories).find(
            (c: any) => c.id === formData.category_id
        )?.category_name;
        return Object.entries(typesVal).reduce((acc, [key, type]: [string, any]) => {
            if (!categoryName || type.categoryName === categoryName) {
                acc[Number(key)] = type.name;
            }
            return acc;
        }, {} as Record<number, string>);
    }, [typesVal, categories, formData.category_id]);

    // --- Global actions ---
    const [enableGlobalPrice, setEnableGlobalPrice] = useState(false);
    const [globalPriceMode, setGlobalPriceMode] = useState<'set' | 'add' | 'subtract'>('set');
    const [globalPriceValue, setGlobalPriceValue] = useState(0);
    const [enableGlobalQuantity, setEnableGlobalQuantity] = useState(false);
    const [globalQuantityMode, setGlobalQuantityMode] = useState<'set' | 'add' | 'subtract'>('set');
    const [globalQuantityValue, setGlobalQuantityValue] = useState(0);
    const [enableDiscountToAll, setEnableDiscountToAll] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);

    const [loading, setLoading] = useState(false);
    const [showFirmModal, setShowFirmModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeModal, setActiveModal] = useState(false);
    const [tableInfo, setTableInfo] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [hasSizes, setHasSizes] = useState(true);
    const prevSizesRef = useRef<SizePrice[]>([]);

    // --- Загрузка данных ---
    useEffect(() => {
        loadSizeTable();
        if (isEdit && id) {
            loadProductData(Number(id));
        } else {
            const timer = setTimeout(() => {
                dispatch(finishLoading());
            }, 0);

            return () => clearTimeout(timer);
        }
    }, [id, isEdit]);

    const loadSizeTable = async () => {
        await getSizeTable('clothes', setTableInfo);
    };
    const handleDeleteProduct = async () => {
        // Показываем предупреждение (можно заменить на кастомное модальное окно, но в задании – alert)
        const confirmed = window.confirm(
            'Это действие полностью удалит товар из базы данных. Продолжить?'
        );
        if (!confirmed || !formData.id) return;

        setLoading(true);
        try {
            await deleteAdminProduct(formData.id, () => {
                router.push('/admin/products');
            });
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            // Можно установить serverError для отображения ошибки
            setServerError('Не удалось удалить товар. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };
    const loadProductData = async (productId: number) => {
        setLoading(true);
        try {
            await getAdminProductById(productId, (data) => {
                const brandId = firmMap[data.firm] || -1;
                setSelectedBrandId(brandId);
                setSelectedLineName(data.line || '');

                setFormData({
                    id: data.id,
                    name: data.name,
                    info: data.info,
                    article: data.article,
                    firm: data.firm || '',
                    line: data.line || '',
                    category_id: data.category_id,
                    type_id: data.type_id,
                    bodytype: data.bodytype || 'man',
                    description: data.description || '',
                    sizes: parseSizesFromData(data),
                    images: parseImagesFromData(data),
                    status: data.status || 'draft'
                });
                dispatch(finishLoading());
            });
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFirm = async (formData: FormData) => {
        try {
            await createFirm(formData, (newFirm) => {
                // TODO: добавить новый бренд в Redux через dispatch
                setShowFirmModal(false);
                console.log('Firm created successfully:', newFirm);
            });
        } catch (error) {
            console.error('Error creating firm:', error);
        }
    };

    const parseSizesFromData = (data: any): SizePrice[] => {
        if (!data.info) return [];
        return Object.entries(data.info).map(([size, info]: [string, any]) => ({
            size,
            price: info.price || 0,
            discount: info.discount || 0,
            quantity: info.quantity || 0
        }));
    };

    const parseImagesFromData = (data: any): string[] => {
        if (!data.image_count) return [];
        return Array.from({ length: data.image_count }, (_, i) =>
            `${data.image_path}`
        );
    };

    // --- Функция валидации (по аналогии с SendForm) ---
    const validateForm = useCallback((): boolean => {
        const errors: Record<string, boolean> = {};

        // Обязательные поля
        if (!formData.name.trim()) errors.name = true;
        if (!formData.article.trim()) errors.article = true;
        if (selectedBrandId === -1 || !formData.firm) errors.firm = true;
        if (!formData.category_id) errors.category = true;

        // Изображения (хотя бы одно)
        if (formData.images.length === 0) errors.images = true;

        // Валидация размеров
        if (hasSizes) {
            if (formData.sizes.length === 0) {
                errors.sizes = true;
            } else {
                // Проверяем, что у каждого размера заполнено поле "размер"
                const hasEmptySize = formData.sizes.some(s => !s.size.trim());
                if (hasEmptySize) errors.sizes = true;
            }
        } else {
            // Безразмерный товар: должна быть хотя бы одна запись с ценой > 0
            if (formData.sizes.length === 0 || formData.sizes[0].price <= 0) {
                errors.noSizePrice = true;
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, selectedBrandId, hasSizes]);

    // --- Сброс серверных ошибок при изменении полей ---
    const handleFieldChange = useCallback((field: keyof ProductFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Сбрасываем ошибки сервера при изменении поля
        setServerError(null);
        setFieldServerErrors(prev => ({ ...prev, [field]: '' }));
    }, []);

    // --- Обработка отправки формы ---
    const handleSubmit = async () => {
        setServerError(null);
        setFieldServerErrors({});
        setCheckValid(true);  // включаем отображение ошибок валидации

        if (!validateForm()) {
            // Прокручиваем к первому полю с ошибкой
            const firstErrorField = document.querySelector('.errorField');
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setLoading(true);
        try {
            const sizesForSubmit = formData.sizes.reduce((acc, size) => ({
                ...acc,
                [size.size]: {
                    price: size.price,
                    quantity: size.quantity,
                    discount: size.discount
                }
            }), {});

            const payload = {
                name: formData.name,
                article: formData.article,
                brand_id: firmMap[formData.firm] || selectedBrandId,
                line_id: null,
                line_name: formData.line,
                category_id: formData.category_id,
                type_id: formData.type_id,
                bodytype: formData.bodytype,
                description: formData.description,
                sizes: sizesForSubmit,
                status: formData.status,
                session_id: sessionId
            };

            if (isEdit && formData.id) {
                await updateAdminProduct(formData.id, payload as any, (response) => {
                    console.log('Product updated:', response);
                    router.push('/admin/products');
                });
            } else {
                await createAdminProduct(payload as any, (response) => {
                    console.log('Product created:', response);
                    router.push('/admin/products');
                });
            }
        } catch (error: any) {
            console.error('Error saving product:', error);
            // Обработка ошибок от сервера
            if (error.response?.data) {
                const serverData = error.response.data;
                if (serverData.error) {
                    setServerError(serverData.error);
                }
                if (serverData.errors && typeof serverData.errors === 'object') {
                    // Предполагаем, что сервер возвращает объект { field: "error message" }
                    setFieldServerErrors(serverData.errors);
                } else if (typeof serverData === 'string') {
                    setServerError(serverData);
                } else {
                    setServerError('Ошибка сохранения товара. Попробуйте позже.');
                }
            } else {
                setServerError('Ошибка сети. Проверьте подключение.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Остальные обработчики (без изменений) ---
    const handleToggleSizeMode = (value: boolean) => {
        if (value) {
            setFormData(prev => ({ ...prev, sizes: prevSizesRef.current.length ? prevSizesRef.current : [] }));
        } else {
            prevSizesRef.current = formData.sizes;
            setFormData(prev => ({
                ...prev,
                sizes: [{ size: 'no_size', price: 0, discount: 0, quantity: 0 }]
            }));
        }
        setHasSizes(value);
        setCheckValid(false); // сбросить ошибки после переключения режима
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files.length > 0) {
            await uploadImages(Array.from(e.dataTransfer.files));
        }
    }, []);

    const uploadImages = async (files: File[]) => {
        setUploading(true);
        try {
            const targetId = isEdit ? Number(id) : null;
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                const uploadFn = targetId
                    ? (f: File, cb: any) => uploadProductImage(targetId, f, cb)
                    : (f: File, cb: any) => uploadTempImage(sessionId, f, cb);

                await uploadFn(file, (response: any) => {
                    setFormData(prev => ({
                        ...prev,
                        images: [...prev.images, response.image_path]
                    }));
                    // Сбрасываем ошибку изображений, если она была
                    setValidationErrors(prev => ({ ...prev, images: false }));
                });
            }
        } catch (error) {
            console.error('Error uploading images:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (path: string, index: number) => {
        if (isEdit && formData.id) {
            await deleteProductImage(formData.id, path, () => {
                setFormData(prev => ({
                    ...prev,
                    images: prev.images.filter((_, i) => i !== index)
                }));
            });
        } else {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }));
        }
    };

    const handleAddSize = () => {
        setFormData(prev => ({
            ...prev,
            sizes: [...prev.sizes, { size: '', price: 0, discount: 0, quantity: 0 }]
        }));
    };

    const handleRemoveSize = (index: number) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.filter((_, i) => i !== index)
        }));
    };

    const handleSizeChange = (index: number, field: keyof SizePrice, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.map((size, i) =>
                i === index ? { ...size, [field]: value } : size
            )
        }));
    };

    const applyGlobalPrice = useCallback(() => {
        if (!enableGlobalPrice) return;
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.map(size => {
                let newPrice = size.price;
                if (globalPriceMode === 'set') newPrice = globalPriceValue;
                else if (globalPriceMode === 'add') newPrice = size.price + globalPriceValue;
                else if (globalPriceMode === 'subtract') newPrice = Math.max(0, size.price - globalPriceValue);
                return { ...size, price: newPrice };
            })
        }));
    }, [enableGlobalPrice, globalPriceMode, globalPriceValue]);

    const applyGlobalQuantity = useCallback(() => {
        if (!enableGlobalQuantity) return;
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.map(size => {
                let newQty = size.quantity;
                if (globalQuantityMode === 'set') newQty = globalQuantityValue;
                else if (globalQuantityMode === 'add') newQty = (size.quantity || 0) + globalQuantityValue;
                else if (globalQuantityMode === 'subtract') newQty = Math.max(0, (size.quantity || 0) - globalQuantityValue);
                return { ...size, quantity: newQty };
            })
        }));
    }, [enableGlobalQuantity, globalQuantityMode, globalQuantityValue]);

    const applyGlobalDiscount = useCallback(() => {
        if (!enableDiscountToAll) return;
        const percent = Math.min(100, Math.max(0, discountPercent));
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.map(size => ({
                ...size,
                discount: percent
            }))
        }));
    }, [enableDiscountToAll, discountPercent]);

    const handleBrandChange = useCallback((index: string) => {
        const id = Number(index);
        setSelectedBrandId(id);
        setSelectedLineName('');
        setFormData(prev => ({ ...prev, firm: brandsData[id] || '', line: '' }));
        setValidationErrors(prev => ({ ...prev, firm: false }));
    }, [brandsData]);

    const handleLineChange = useCallback((index: string) => {
        const name = linesData[index] || '';
        setSelectedLineName(name);
        setFormData(prev => ({ ...prev, line: name }));
    }, [linesData]);

    const categoryChange = useCallback((index: string) => {
        setFormData(prev => ({ ...prev, category_id: Number(index), type_id: 0 }));
        setValidationErrors(prev => ({ ...prev, category: false }));
    }, []);

    const typeChange = useCallback((index: string) => {
        setFormData(prev => ({ ...prev, type_id: Number(index) }));
    }, []);

    // --- Отрисовка ---
    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>{isEdit ? 'Редактирование товара' : 'Создание товара'}</h2>
                {/* <div className={s.headerActions}>
                    <Button text="Назад" onClick={() => navigate('/admin/products')} />
                    <Button
                        text={isEdit ? 'Сохранить' : 'Создать'}
                        onClick={handleSubmit}
                        disabled={loading}
                    />
                </div> */}
            </div>

            {/* Глобальная ошибка сервера */}
            {serverError && (
                <div className={s.serverError}>
                    {serverError}
                </div>
            )}

            <div className={s.content}>
                {/* Левая колонка: изображения */}
                <aside className={s.leftColumn}>
                    <div
                        ref={dropZoneRef}
                        className={`${s.dropZone} ${dragActive ? s.dragActive : ''} ${checkValid && validationErrors.images ? s.errorDropZone : ''}`}
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
                            onChange={(e) => e.target.files && uploadImages(Array.from(e.target.files))}
                            style={{ display: 'none' }}
                        />
                        {formData.images.length === 0 ? (
                            <div className={s.dropZoneContent}>
                                <UploadIcon className={s.uploadIcon} />
                                <p>Перетащите изображения или кликните для выбора</p>
                                {checkValid && validationErrors.images && (
                                    <p className={s.errorText}>Добавьте хотя бы одно изображение</p>
                                )}
                            </div>
                        ) : (
                            <div className={s.imagesGrid}>
                                {formData.images.map((img, idx) => (
                                    <div key={idx} className={s.imageItem}>
                                        <img src={img} alt={`product ${idx + 1}`} />
                                        <button
                                            className={s.deleteImageBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage(img, idx);
                                            }}
                                        >
                                            <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                        </button>
                                    </div>
                                ))}
                                <div className={s.addImageBtn} onClick={() => fileInputRef.current?.click()}>
                                    <AddIcon />
                                    <span>Добавить</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {uploading && <div className={s.uploading}>Загрузка...</div>}
                </aside>

                {/* Правая колонка: форма */}
                <main className={s.rightColumn}>
                    <section className={s.card}>
                        <h3>Основная информация</h3>

                        {/* Название товара */}
                        <InputWithLabelWithValidation
                            val={formData.name}
                            valid={!checkValid || !validationErrors.name}
                            invalidText="Введите название товара"
                            onChange={(data) => handleFieldChange('name', data)}
                            placeholder="Название товара *"
                        />
                        {fieldServerErrors.name && <div className={s.fieldError}>{fieldServerErrors.name}</div>}

                        <div className={s.formRow}>
                            {/* Артикул */}
                            <InputWithLabelWithValidation
                                val={formData.article}
                                valid={!checkValid || !validationErrors.article}
                                invalidText="Введите артикул"
                                onChange={(data) => handleFieldChange('article', data)}
                                placeholder="Артикул *"
                            />
                            {fieldServerErrors.article && <div className={s.fieldError}>{fieldServerErrors.article}</div>}

                            {/* Тип тела */}
                            <div className={s.formGroup}>
                                <label>Тип тела</label>
                                <Combobox
                                    enumProp={true}
                                    data={{ man: 'Мужской', woman: 'Женский', child: 'Детский', unisex: 'Унисекс' }}
                                    placeholder="Тип тела"
                                    onChangeIndex={(v) => setFormData(prev => ({ ...prev, bodytype: v as any }))}
                                    width="100%"
                                    currentIndex={formData.bodytype}
                                />
                            </div>
                        </div>

                        <div className={s.formRow}>
                            {/* Фирма */}
                            <div className={s.formGroup}>
                                <label>Фирма *</label>
                                <ComboboxWithSearch
                                    data={brandsData}
                                    placeholder="Выберите фирму"
                                    onChangeIndex={handleBrandChange}
                                    width="100%"
                                    currentIndex={selectedBrandId}
                                    className={checkValid && validationErrors.firm ? s.errorCombobox : ''}
                                />
                                {checkValid && validationErrors.firm && (
                                    <div className={s.errorText}>Выберите фирму</div>
                                )}
                                {fieldServerErrors.brand_id && <div className={s.fieldError}>{fieldServerErrors.brand_id}</div>}
                                <Button
                                    text="Управление фирмами"
                                    onClick={() => setShowFirmModal(true)}
                                    style={{ marginTop: 8 }}
                                />
                            </div>

                            {/* Линейка (необязательная) */}
                            {linesData && Object.keys(linesData).length > 0 && (
                                <div className={s.formGroup}>
                                    <label>Линейка / Коллекция</label>
                                    <ComboboxWithSearch
                                        data={linesData}
                                        placeholder="Выберите линейку"
                                        onChangeIndex={handleLineChange}
                                        width="100%"
                                        currentIndex={Object.entries(linesData).find(([_, name]) => name === selectedLineName)?.[0] || -1}
                                    />
                                </div>
                            )}
                        </div>

                        <div className={s.formRow}>
                            {/* Категория */}
                            <div className={s.formGroup}>
                                <label>Категория *</label>
                                <Combobox
                                    enumProp={true}
                                    data={categoriesComboboxData}
                                    placeholder="Выберите категорию"
                                    onChangeIndex={categoryChange}
                                    width="100%"
                                    currentIndex={formData.category_id}
                                    className={checkValid && validationErrors.category ? s.errorCombobox : ''}
                                />
                                {checkValid && validationErrors.category && (
                                    <div className={s.errorText}>Выберите категорию</div>
                                )}
                                {fieldServerErrors.category_id && <div className={s.fieldError}>{fieldServerErrors.category_id}</div>}
                            </div>

                            {/* Тип товара */}
                            {formData.category_id > 0 && (
                                <div className={s.formGroup}>
                                    <label>Тип товара</label>
                                    <Combobox
                                        enumProp={true}
                                        data={typesComboboxData}
                                        placeholder="Выберите тип товара"
                                        onChangeIndex={typeChange}
                                        width="100%"
                                        currentIndex={formData.type_id}
                                    />
                                </div>
                            )}
                        </div>

                        <div className={s.formGroup}>
                            <label>Описание</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                placeholder="Введите описание товара"
                            />
                        </div>
                        <div className={s.formGroup}>
                            <label>Статус</label>
                            <Combobox
                                enumProp={true}
                                data={availableStatuses}
                                placeholder="Выберите статус"
                                onChangeIndex={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                                width="100%"
                                currentIndex={formData.status}
                            />
                        </div>
                    </section>

                    {/* Размеры и цены */}
                    <section className={s.card}>
                        <div className={s.sizeTableHeader}>
                            <h3>Размеры и цены</h3>
                            <div className={s.sizeTypeSwitch}>
                                <button
                                    className={`${s.switchBtn} ${hasSizes ? s.active : ''}`}
                                    onClick={() => handleToggleSizeMode(true)}
                                    type="button"
                                >
                                    Размерный
                                </button>
                                <button
                                    className={`${s.switchBtn} ${!hasSizes ? s.active : ''}`}
                                    onClick={() => handleToggleSizeMode(false)}
                                    type="button"
                                >
                                    Безразмерный
                                </button>
                            </div>
                        </div>

                        {hasSizes && (
                            <div className={s.bulkActions}>
                                {/* ... все bulk actions без изменений ... */}
                                <div className={s.bulkGroup}>
                                    <Checkbox enable={true} activeData={enableDiscountToAll} onChange={setEnableDiscountToAll} />
                                    <span className={s.bulkLabel}>Скидка (%)</span>
                                    <NumInput
                                        disabled={!enableDiscountToAll}
                                        min={0}
                                        max={100}
                                        value={discountPercent}
                                        onChange={setDiscountPercent}
                                        className={s.smallInput}
                                    />
                                    <Button text="Применить" onClick={applyGlobalDiscount} disabled={!enableDiscountToAll} />
                                </div>

                                <div className={s.bulkGroup}>
                                    <Checkbox enable={true} activeData={enableGlobalPrice} onChange={setEnableGlobalPrice} />
                                    <span className={s.bulkLabel}>Цена</span>
                                    <select
                                        value={globalPriceMode}
                                        onChange={(e) => setGlobalPriceMode(e.target.value as any)}
                                        disabled={!enableGlobalPrice}
                                        className={s.modeSelect}
                                    >
                                        <option value="set">=</option>
                                        <option value="add">+</option>
                                        <option value="subtract">−</option>
                                    </select>
                                    <NumInput
                                        disabled={!enableGlobalPrice}
                                        min={0}
                                        value={globalPriceValue}
                                        onChange={setGlobalPriceValue}
                                        className={s.smallInput}
                                    />
                                    <Button text="Применить" onClick={applyGlobalPrice} disabled={!enableGlobalPrice} />
                                </div>

                                <div className={s.bulkGroup}>
                                    <Checkbox enable={true} activeData={enableGlobalQuantity} onChange={setEnableGlobalQuantity} />
                                    <span className={s.bulkLabel}>Кол-во</span>
                                    <select
                                        value={globalQuantityMode}
                                        onChange={(e) => setGlobalQuantityMode(e.target.value as any)}
                                        disabled={!enableGlobalQuantity}
                                        className={s.modeSelect}
                                    >
                                        <option value="set">=</option>
                                        <option value="add">+</option>
                                        <option value="subtract">−</option>
                                    </select>
                                    <NumInput
                                        disabled={!enableGlobalQuantity}
                                        min={0}
                                        value={globalQuantityValue}
                                        onChange={setGlobalQuantityValue}
                                        className={s.smallInput}
                                    />
                                    <Button text="Применить" onClick={applyGlobalQuantity} disabled={!enableGlobalQuantity} />
                                </div>

                                <Button className={s.addSizeBtn} text="+ Добавить размер" onClick={handleAddSize} />
                            </div>
                        )}

                        <div className={s.sizesTableWrapper}>
                            <table className={s.sizesGrid}>
                                <thead>
                                    <tr>
                                        <th>Размер</th>
                                        <th>Цена</th>
                                        <th>Скидка (%)</th>
                                        <th>Кол-во</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.sizes.map((size, idx) => (
                                        <tr key={idx}>
                                            <td data-label="Размер">
                                                {hasSizes ? (
                                                    <Input
                                                        value={size.size}
                                                        onChange={(val) => handleSizeChange(idx, 'size', val)}
                                                        className={checkValid && validationErrors.sizes && !size.size.trim() ? s.errorInput : ''}
                                                    />
                                                ) : (
                                                    <span className={s.noSizeLabel}>{size.size}</span>
                                                )}
                                                {checkValid && validationErrors.sizes && hasSizes && !size.size.trim() && (
                                                    <div className={s.errorText}>Заполните размер</div>
                                                )}
                                            </td>
                                            <td data-label="Цена">
                                                <NumInput
                                                    min={0}
                                                    value={size.price}
                                                    onChange={(val) => handleSizeChange(idx, 'price', val)}
                                                    disabled={enableGlobalPrice && hasSizes}
                                                />
                                            </td>
                                            <td data-label="Скидка (%)">
                                                <NumInput
                                                    min={0}
                                                    max={100}
                                                    value={enableDiscountToAll && hasSizes ? discountPercent : size.discount}
                                                    onChange={(val) => handleSizeChange(idx, 'discount', val)}
                                                    disabled={enableDiscountToAll && hasSizes}
                                                />
                                            </td>
                                            <td data-label="Кол-во">
                                                <NumInput
                                                    min={0}
                                                    value={size.quantity}
                                                    onChange={(val) => handleSizeChange(idx, 'quantity', val)}
                                                    disabled={enableGlobalQuantity && hasSizes}
                                                />
                                            </td>
                                            <td data-label="">
                                                {hasSizes && (
                                                    <button className={s.removeBtn} onClick={() => handleRemoveSize(idx)}>
                                                        <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.sizes.length === 0 && hasSizes && (
                                <div className={s.emptySizes}>Нет размеров. Используйте кнопку «+ Добавить размер»</div>
                            )}
                            {checkValid && validationErrors.sizes && hasSizes && formData.sizes.length === 0 && (
                                <div className={s.errorText}>Добавьте хотя бы один размер</div>
                            )}
                            {!hasSizes && checkValid && validationErrors.noSizePrice && (
                                <div className={s.errorText}>Укажите цену для безразмерного товара</div>
                            )}
                        </div>

                    </section>
                    <Button
                        text={isEdit ? 'Сохранить' : 'Создать'}
                        onClick={handleSubmit}
                        disabled={loading}
                        className={'btnStyle'}
                    />
                    {isEdit && user?.role === 'superadmin' && (
                        <Button
                            className={'btnStyle'}
                            onClick={handleDeleteProduct}
                            disabled={loading}
                            text={'Удалить товар'}
                        // style={{ background: 'red', color: 'white', marginLeft: 'auto' }}
                        />


                    )}
                    <section className={s.card}>
                        <div className={s.sizeTableHeader}>
                            <h3>Таблица размеров</h3>
                            <button className={s.linkBtn} onClick={() => setActiveModal(true)}>
                                Открыть таблицу
                            </button>
                        </div>
                    </section>
                </main>
            </div>

            <Modal active={activeModal} onChange={setActiveModal}>
                <div className={s.scrollContainer}>
                    <Scroller onlyVertical={true} className={s.scrollStyle}>
                        {tableInfo && (
                            <TableWithComboboxColumn
                                className={s.modalTable}
                                table={tableInfo.table}
                                comboTable={tableInfo.comboTable}
                            />
                        )}
                    </Scroller>
                </div>
            </Modal>

            <Modal active={showFirmModal} onChange={setShowFirmModal}>
                <Scroller onlyVertical={true} className={s.scrollStyle}>
                    <div className={s.firmModalContent}>
                        <FirmForm onSubmit={handleCreateFirm} onCancel={() => setShowFirmModal(false)} />
                    </div>
                </Scroller>
            </Modal>
        </div>
    );
};

export default AdminProductForm;