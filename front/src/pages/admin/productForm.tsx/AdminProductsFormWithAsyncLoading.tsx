// pages/admin/ProductForm/AdminProductForm.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from 'src/store/hooks/redux';
import { toPrice } from 'src/global';
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import Scroller from 'src/components/scroller/Scroller';
import TableWithComboboxColumn from 'src/components/table/simpleTable/TableWithComboboxColumn';
import Combobox from 'src/components/combobox/Combobox'; // Добавлен импорт Combobox
import ComboboxWithSearch from 'src/components/combobox/ComboboxWithSearch';
import { getSizeTable } from "src/providers/merchProvider";
import { ProductFormData, FirmFormData } from 'src/types/adminProduct';
import FirmForm from 'src/modules/admin/firmForm/FirmForm';
import {
    getAdminProductById,
    createAdminProduct,
    updateAdminProduct,
    uploadProductImage,
    deleteProductImage,
    createFirm,
    updateFirm,
    getBrandsWithLines,
    uploadTempImage
} from 'src/providers/adminProductsProvider';
import s from './style.module.css';
import { ReactComponent as AddIcon } from '/public/add.svg';
import { ReactComponent as UploadIcon } from '/public/upload.svg';
import deleteIconUrl from '/public/delete.svg';
import NumInput from 'src/components/input/NumInput';
import Input from 'src/components/input/Input';
import Checkbox from 'src/components/checkbox/Checkbox';

interface SizePrice {
    size: string;
    price: number;
    discount?: number;
    quantity: number;
}

const AdminProductForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id && id !== 'create';
    const { typesVal, categories, firms } = useAppSelector(state => state.menuReducer);
    const sessionId = useMemo(() => {
        if (!isEdit) {
            return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return '';
    }, []);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        article: '',
        firm: '',
        line: '',
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
    // Преобразуем типы товаров в формат для Combobox
    const typesComboboxData = useMemo(() => {
        let categoryName
        let data = Object.entries(categories)
        data.forEach(([key, val]) => {
            if (val.id === formData.category_id) {
                categoryName = val.category_name
            }
        });
        return Object.entries(typesVal).reduce((acc, [key, type]: [string, any]) => {
            if (!categoryName || type.categoryName === categoryName) {
                acc[Number(key)] = type.name;
            }
            return acc;
        }, {} as { [key: number]: string });
    }, [typesVal, categories, formData.category_id]);

    // Преобразуем категории в формат для Combobox
    const categoriesComboboxData = Object.values(categories).reduce((acc, cat: any) => {
        acc[cat.id] = cat.category_name;
        return acc;
    }, {} as { [key: number]: string });

    const firmsComboboxData = firms.reduce((acc, firm: any, index) => {
        acc[index] = firm;
        return acc;
    }, {} as { [key: number]: string });


    const [loading, setLoading] = useState(false);
    const [showFirmModal, setShowFirmModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeModal, setActiveModal] = useState(false);
    const [tableInfo, setTableInfo] = useState<any>(null);
    const [discountToAll, setDiscountToAll] = useState(0);
    const [enableDiscountToAll, setEnableDiscountToAll] = useState(false);
    const [brands, setBrands] = useState<any>({});
    const linesMap = useRef({});
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const brandId = useRef(-1)
    const lineId = useRef(-1)
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const firmsWithLines = useRef({})
    const [dragActive, setDragActive] = useState(false);
    const handleCreateFirm = async (formData: FormData) => {
        try {
            await createFirm(formData, (newFirm) => {
                // Обновляем список фирм в Redux store
                // Здесь нужно добавить экшен для обновления firms в store
                // dispatch(addFirm(newFirm));

                // Выбираем созданную фирму
                setFormData(prev => ({ ...prev, firm: newFirm.name }));

                // Закрываем модальное окно
                setShowFirmModal(false);

                // Показываем уведомление об успехе
                console.log('Firm created successfully:', newFirm);
            });
        } catch (error) {
            console.error('Error creating firm:', error);
        }
    };
    // Загрузка данных при редактировании
    useEffect(() => {
        const loadAllData = async () => {
            // Параллельная загрузка всех данных
            await Promise.all([
                isEdit && id ? loadProductData(Number(id)) : Promise.resolve(),
                loadSizeTable(),
                loadBrandsAndLines() // Новая функция
            ]);
        };

        loadAllData();
    }, [id, isEdit]);


    const lines = useMemo(() => {
        let linesData = {}
        linesMap.current[brandId.current] && linesMap.current[brandId.current].map(el => {
            linesData[el.id] = el.name
        })
        return linesData
    }, [brands, formData])


    const loadBrandsAndLines = async () => {
        try {
            let resp = await getBrandsWithLines({});
            let brandsList = {}
            resp.forEach(item => (brandsList[item.id] = item.name));
            const linesMapData = {};
            resp.forEach(brand => {
                linesMapData[brand.id] = brand.lines;
            });
            linesMap.current = linesMapData
            setBrands(brandsList);
        } catch (error) {
            console.error('Error loading brands with lines:', error);
        }
    };

    const loadProductData = async (productId: number) => {
        setLoading(true);
        try {
            await getAdminProductById(productId, (data) => {
                setFormData({
                    id: data.id,
                    name: data.name,
                    info: data.info,
                    article: data.article,
                    firm: data.firm,
                    line: data.line || '',
                    category_id: data.category_id,
                    type_id: data.type_id,
                    bodytype: data.bodytype || 'man',
                    description: data.description || '',
                    sizes: parseSizesFromData(data),
                    images: parseImagesFromData(data),
                    status: data.status || 'draft'
                });
            });
        } catch (error) {
            console.error('Error loading product:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSizeTable = async () => {
        await getSizeTable('clothes', setTableInfo);
    };

    const parseSizesFromData = (data: any): SizePrice[] => {
        if (!data.info) return [];
        return Object.entries(data.info).map(([size, info]: [string, any]) => ({
            size,
            price: info.price || 0,
            discount: info.discount,
            quantity: info.quantity || 0
        }));
    };

    const parseImagesFromData = (data: any): string[] => {
        if (!data.image_count) return [];
        const images = [];
        for (let i = 1; i <= data.image_count; i++) {
            images.push(`${data.image_path}${i}.png`);
        }
        return images;
    };

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

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            await uploadImages(files);
        }
    }, []);

    const uploadImages = async (files: File[]) => {
        setUploading(true);
        try {
            if (sessionId) {
                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        await uploadTempImage(sessionId, file, (response) => {
                            setFormData(prev => ({
                                ...prev,
                                images: [...prev.images, response.image_path]
                            }));
                        });
                    }
                }
            } else {
                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        await uploadProductImage(Number(id), file, (response) => {
                            setFormData(prev => ({
                                ...prev,
                                images: [...prev.images, response.image_path]
                            }));
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error uploading images:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async (index: number) => {
        if (isEdit && formData.id) {
            await deleteProductImage(formData.id, index + 1, () => {
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

    // Управление размерами
    const handleAddSize = () => {
        setFormData(prev => ({
            ...prev,
            sizes: [...prev.sizes, { size: '', price: 0, quantity: 0 }]
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

    const handleApplyDiscountToAll = (discountPercent: number) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.map(size => ({
                ...size,
                discount: size.price * (discountPercent / 100)
            }))
        }));
        setDiscountToAll(discountPercent);
    };

    // Обработчики для Combobox
    const handleTypeChange = useCallback((index: string) => {
        setFormData(prev => ({ ...prev, type_id: Number(index) }));
    }, []);

    const handleCategoryChange = useCallback((index: string) => {
        setFormData(prev => ({ ...prev, category_id: Number(index) }));
    }, []);
    const handleFirmChange = useCallback((index: string) => {
        brandId.current = Number(index)
        lineId.current = -1
        setFormData(prev => ({ ...prev, firm: brands[index], line: "" }));
    }, []);
    const handleLineChange = useCallback((index: string) => {
        lineId.current = Number(index)
        setFormData(prev => ({ ...prev, line: lines[index] }));
    }, [lines]);
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const submitData = {
                name: formData.name,
                article: formData.article,
                firm: formData.firm,
                line: formData.line,
                category: formData.category_id,
                type: formData.type_id,
                bodytype: formData.bodytype,
                description: formData.description,
                sizes: formData.sizes.reduce((acc, size) => ({
                    ...acc,
                    [size.size]: {
                        price: size.price,
                        quantity: size.quantity
                    }
                }), []),
                status: formData.status,
                session_id: sessionId 
            };

            if (isEdit && formData.id) {
                await updateAdminProduct(formData.id, submitData, (response) => {
                    console.log('Product updated:', response);
                    navigate('/admin/products');
                });
            } else {
                await createAdminProduct(submitData as any, (response) => {
                    console.log('Product created:', response);
                    navigate('/admin/products');
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>{isEdit ? 'Редактирование товара' : 'Создание товара'}</h2>
                <div className={s.headerActions}>
                    <Button text="Назад" onClick={() => navigate('/admin/products')} />
                    <Button
                        text={isEdit ? 'Сохранить' : 'Создать'}
                        onClick={handleSubmit}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className={s.content}>
                {/* Левая колонка - изображения */}
                <div className={s.leftColumn}>
                    <div
                        ref={dropZoneRef}
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
                            onChange={(e) => e.target.files && uploadImages(Array.from(e.target.files))}
                            style={{ display: 'none' }}
                        />

                        {formData.images.length === 0 ? (
                            <div className={s.dropZoneContent}>
                                <UploadIcon className={s.uploadIcon} />
                                <p>Перетащите изображения или кликните для выбора</p>
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
                                                handleDeleteImage(idx);
                                            }}
                                        >
                                            <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                        </button>
                                    </div>
                                ))}
                                <div
                                    className={s.addImageBtn}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <AddIcon />
                                    <span>Добавить</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {uploading && <div className={s.uploading}>Загрузка...</div>}
                </div>

                {/* Правая колонка - информация */}
                <div className={s.rightColumn}>
                    {/* Основная информация */}
                    <div className={s.section}>
                        <h3>Основная информация</h3>
                        <div className={s.formGroup}>
                            <label>Название товара *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Введите название"
                            />
                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Артикул *</label>
                                <input
                                    type="text"
                                    value={formData.article}
                                    onChange={(e) => setFormData(prev => ({ ...prev, article: e.target.value }))}
                                    placeholder="Введите артикул"
                                />
                            </div>
                            <div className={s.formGroup}>
                                <label>Тип тела</label>
                                <select value={formData.bodytype} onChange={(e) => setFormData(prev => ({ ...prev, bodytype: e.target.value as "man" | "woman" | "unisex" }))}>
                                    <option value="man">Мужской</option>
                                    <option value="woman">Женский</option>
                                    <option value="child">Детский</option>
                                    <option value="unisex">Унисекс</option>
                                </select>
                            </div>

                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <div className={s.formGroup}>
                                    <label>Фирмы</label>
                                    <ComboboxWithSearch
                                        data={brands}
                                        placeholder="Выберите фирму"

                                        onChangeIndex={handleFirmChange}
                                        width="100%"
                                        currentIndex={brandId.current}
                                    />
                                </div>
                                <Button text="Редактировать фирмы" onClick={() => {
                                    setShowFirmModal(true)
                                }} />
                            </div>


                            {Object.values(lines).length ? <div className={s.formGroup}>
                                <label>Линейка / Коллекция</label>
                                <ComboboxWithSearch
                                    data={lines}
                                    placeholder="Выберите линейку"
                                    onChangeIndex={handleLineChange}

                                    width="100%"
                                    currentIndex={lineId.current}
                                />
                            </div> : null}



                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Категория</label>
                                <Combobox
                                    enumProp={true}
                                    data={categoriesComboboxData}
                                    placeholder="Выберите категорию"
                                    onChangeIndex={handleCategoryChange}
                                    width="100%"
                                    currentIndex={formData.category_id}
                                />
                            </div>
                            {formData.category_id ? <div className={s.formGroup}>
                                <label>Тип товара</label>
                                <Combobox
                                    enumProp={true}
                                    data={typesComboboxData}
                                    placeholder="Выберите тип товара"
                                    onChangeIndex={handleTypeChange}
                                    width="100%"
                                    currentIndex={formData.type_id}
                                />
                            </div> : null}

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
                            <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}>
                                <option value="draft">Черновик</option>
                                <option value="active">Активен (на витрине)</option>
                                <option value="archived">Архивирован</option>
                            </select>
                        </div>
                    </div>

                    {/* Размеры и цены */}
                    <div className={s.section}>
                        <div className={s.sectionHeader}>
                            <h3>Размеры и цены</h3>
                            <div className={s.bulkDiscount}>
                                <p>
                                    Скидка % на все размеры
                                </p>
                                <Checkbox enable={true} activeData={enableDiscountToAll} onChange={val => setEnableDiscountToAll(val)} />
                                <NumInput disabled={!enableDiscountToAll} min={0} value={0} onChange={handleApplyDiscountToAll} />
                                <Button text="Добавить размер" onClick={handleAddSize} />
                            </div>
                        </div>

                        <div className={s.sizesTable}>
                            <table className={s.sizesGrid}>
                                <thead>
                                    <tr>
                                        <th>Размер</th>
                                        <th>Цена</th>
                                        <th>Скидка</th>
                                        <th>Количество</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.sizes.map((size, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <Input onChange={(val) => handleSizeChange(idx, 'size', val)} value=''></Input>
                                            </td>
                                            <td>
                                                <NumInput min={0} value={0} onChange={(val) => handleSizeChange(idx, 'price', val)} />
                                            </td>
                                            <td>
                                                {<NumInput disabled={enableDiscountToAll} min={0} value={enableDiscountToAll && discountToAll ? discountToAll : 0} onChange={(val) => handleSizeChange(idx, 'discount', val)} />}
                                            </td>
                                            <td>
                                                <NumInput min={0} value={0} onChange={(val) => handleSizeChange(idx, 'quantity', val)} />
                                            </td>
                                            <td>
                                                <button
                                                    className={s.removeBtn}
                                                    onClick={() => handleRemoveSize(idx)}
                                                >
                                                    <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {formData.sizes.length === 0 && (
                                <div className={s.emptySizes}>Нет добавленных размеров. Нажмите "Добавить размер"</div>
                            )}
                        </div>
                    </div>

                    {/* Таблица размеров (справочно) */}
                    <div className={s.section}>
                        <div className={s.sizeTableHeader}>
                            <h3>Таблица размеров</h3>
                            <button className={s.linkBtn} onClick={() => setActiveModal(true)}>
                                Открыть таблицу
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно с таблицей размеров */}
            <Modal onChange={setActiveModal} active={activeModal}>
                <div className={s.scrollContainer}>
                    <Scroller onlyVertical={true} className={s.scrollStyle}>
                        {tableInfo && (
                            <TableWithComboboxColumn
                                className={s.modalTable}
                                // sizes={tableInfo.sizes}
                                table={tableInfo.table}
                                comboTable={tableInfo.comboTable}
                            />
                        )}
                    </Scroller>
                </div>
            </Modal>
            <Modal
                active={showFirmModal}
                onChange={setShowFirmModal}
            > <Scroller onlyVertical={true} className={s.scrollStyle}>
                    <div className={s.firmModalContent}>
                        <FirmForm
                            onSubmit={handleCreateFirm}
                            onCancel={() => setShowFirmModal(false)}
                        />
                    </div>
                </Scroller>
            </Modal>
        </div>
    );
};

export default AdminProductForm;