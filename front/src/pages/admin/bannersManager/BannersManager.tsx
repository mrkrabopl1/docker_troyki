// pages/admin/Banners/BannersManager.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/router';
import Button from 'src/components/Button'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import { getBannersAndFilters, getBanners, createAdminBanner, updateAdminBanner, deleteAdminBanner } from 'src/providers/adminBannersProvider'
import { types } from 'src/store/reducers/menuSlice';
import { finishLoading } from 'src/store/reducers/loadingSlice'
import Modal from 'src/components/modal/Modal';
import { CheckBoxType } from 'src/types/modules';
import deleteIconUrl from '/public/delete.svg';
import CloseButton from 'src/components/button/CloseButton';
interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
    sort_order: number;
    conditions: any;
    created_at: string;
}

interface FiltersState {
    priceProps: {
        max: number
        min: number
        dataLeft?: number
        dataRight?: number
    }
    soloDataProps: CheckBoxType[]
    checboxsProps: {
        name: string
        id: string
        props: CheckBoxType[]
    }[]
}

const BannersManager: React.FC = () => {
    const router = useRouter();
    const { typesVal, firmMap, discountRules } = useAppSelector(state => state.menuReducer)
    const dispatch = useAppDispatch();

    // Фильтры - храним ID для фирм
    const filtersInfo = useRef<any>({
        sizes: [],
        price: [],
        product_types: [],
        bodytypes: [],
        firms: [], // ← здесь хранятся ID фирм
        store: false,
        discount: false,
        withPrice: true,
        is_active: undefined
    })

    const allFilters = useRef<any>({
        sizes: [],
        price: [],
        product_types: [],
        bodytypes: [],
        firms: [],
        store: false,
        discount: false,
        withPrice: true,
        is_active: undefined
    })

    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(false)
    const [showFiltersPanel, setShowFiltersPanel] = useState(false)
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [errors, setErrors] = useState<{ image?: boolean; filters?: boolean }>({})
    const [filtersState, setFilters] = useState<FiltersState>({
        priceProps: { max: 0, min: 0 },
        checboxsProps: [],
        soloDataProps: []
    })

    const activeSizes = useRef<string[]>([])
    const firms = useRef<string[]>([]) // ← здесь хранятся названия фирм для UI

    // Конвертация фильтров для ProductsFilters (ИСПРАВЛЕНО)
    const convertFiltersData = useCallback((resData: any) => {
        const priceProps = {
            min: resData.price?.[0] || 0,
            max: resData.price?.[1] || 100000,
            dataLeft: filtersInfo.current.price?.[0] || resData.price?.[0] || 0,
            dataRight: filtersInfo.current.price?.[1] || resData.price?.[1] || 100000
        }
        allFilters.current = resData
        activeSizes.current = []
        firms.current = []
        const checkBoxPropsData: CheckBoxType[] = []

        if (resData.sizes) {
            Object.entries(resData.sizes).forEach(([size]) => {
                activeSizes.current.push(size)
                const active = filtersInfo.current.sizes?.includes(size) || false
                checkBoxPropsData.push({
                    id: size,
                    enable: true,
                    activeData: active,
                    name: size
                })
            })
        }

        const checkBoxPropsProductsData: CheckBoxType[] = []
        if (resData.product_types) {
            resData.product_types.forEach((typeId: number) => {
                const typeDescr = typesVal[typeId];
                if (!typeDescr) return;
                const active = filtersInfo.current.product_types?.includes(typeId) || false
                checkBoxPropsProductsData.push({
                    id: typeId,
                    enable: true,
                    activeData: active,
                    name: typeDescr.name
                })
            })
        }

        const checkBoxBodyTypesData: CheckBoxType[] = []
        if (resData.bodytypes) {
            Object.entries(resData.bodytypes).forEach(([bodytype]) => {
                const active = filtersInfo.current.bodytypes?.includes(bodytype) || false
                checkBoxBodyTypesData.push({
                    id: bodytype,
                    enable: true,
                    activeData: active,
                    name: bodytype
                })
            })
        }

        // Обработка фирм (ИСПРАВЛЕНО)
        const checkBoxPropsFirmData: CheckBoxType[] = []
        Object.entries(resData.firms || {}).forEach(([firmName]) => {
            // Ищем фирму по имени в firmMap
            const firm = Object.values(firmMap).find(f => f.name === firmName);
            if (!firm) {
                console.warn(`Firm "${firmName}" not found in firmMap`);
                return;
            }

            firms.current.push(firmName); // сохраняем имя для UI

            // Проверяем, активна ли фирма в текущих фильтрах (по ID)
            const active = filtersInfo.current.firms?.includes(firm.id) || false;

            checkBoxPropsFirmData.push({
                id: firm.slug, // ← используем slug как id для UI
                enable: true,
                activeData: active,
                name: firmName
            });
        })

        // Solo чекбоксы
        const soloDataProps: CheckBoxType[] = [
            {
                id: 'active',
                enable: true,
                activeData: filtersInfo.current.is_active === true,
                name: "На витрине"
            },
            {
                id: 'inactive',
                enable: true,
                activeData: filtersInfo.current.is_active === false,
                name: "Скрытые"
            },
        ]

        return {
            priceProps,
            checboxsProps: [
                { id: "sizes", name: "Размеры", props: checkBoxPropsData },
                { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
                { id: "type", name: "Типы товара", props: checkBoxPropsProductsData },
                { id: "bodytypes", name: "Форма тела", props: checkBoxBodyTypesData }
            ],
            soloDataProps
        }
    }, [typesVal, firmMap])

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

    useEffect(() => {
        if (Object.values(typesVal).length) {
            loadData()
        }
    }, [loadBanners, typesVal])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getBannersAndFilters()
            dispatch(finishLoading());
            setFilters(convertFiltersData(data.filters))
            setBanners(data.banners)
        } catch (error) {
            console.error('Error loading banners and filters:', error)
        } finally {
            setLoading(false)
        }
    }, [convertFiltersData])

    const loadFilters = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/products/filters')
            const data = await response.json()
            if (data.filters) {
                const converted = convertFiltersData(data.filters)
                setFilters(converted)
            }
        } catch (error) {
            console.error('Error loading filters:', error)
        }
    }, [convertFiltersData])

    useEffect(() => {
        loadFilters()
    }, [loadFilters])

    // Обработчик изменения фильтров (ИСПРАВЛЕНО)
    const onFiltersChange = useCallback((filter: any) => {
        switch (filter.id) {
            case "sizes":
                filtersInfo.current.sizes = filter.data || []
                break
            case "price":
                filtersInfo.current.price = filter.data || [0, 100000]
                break
            case "firms":
                // filter.data - массив slug'ов от чекбоксов
                // Преобразуем slug'и в ID для запроса к API
                filtersInfo.current.firms = (filter.data || [])
                    .map((slug: string) => firmMap[slug]?.id)
                    .filter(Boolean) as number[];
                break
            case "type":
                filtersInfo.current.product_types = filter.data || []
                break
            case "bodytypes":
                filtersInfo.current.bodytypes = filter.data || []
                break
            case "solo":
                // filter.data - массив CheckBoxType
                if (filter.data && filter.data.length > 0) {
                    const activeItem = filter.data.find((item: CheckBoxType) => item.id === 'active');
                    const inactiveItem = filter.data.find((item: CheckBoxType) => item.id === 'inactive');

                    if (activeItem?.activeData) {
                        filtersInfo.current.is_active = true;
                    } else if (inactiveItem?.activeData) {
                        filtersInfo.current.is_active = false;
                    } else {
                        filtersInfo.current.is_active = undefined;
                    }
                }
                break
            default:
                break
        }

        // Сбрасываем ошибку фильтров при изменении
        setErrors(prev => ({ ...prev, filters: false }))
    }, [firmMap])

    const generateUrlFromFilters = (filters: any): string => {
        const params = new URLSearchParams()

        if (filters.product_types && filters.product_types.length > 0) {
            filters.product_types.forEach((product_type: number) => {
                const type = typesVal[product_type]
                if (type) params.append('type', type.type_key)
            })
        }

        if (filters.firms && filters.firms.length > 0) {
            // filters.firms - массив ID, нужно получить имена для URL
            filters.firms.forEach((firmId: number) => {
                const firm = Object.values(firmMap).find(f => f.id === firmId);
                if (firm) params.append('brand', firm.slug) // ← используем slug
            })
        }

        if (filters.sizes && filters.sizes.length > 0) {
            filters.sizes.forEach(size => params.append('size', size))
        }

        if (filters.bodytypes && filters.bodytypes.length > 0) {
            filters.bodytypes.forEach(bodytype => params.append('bodytype', bodytype))
        }

        if (filters.price && filters.price.length === 2) {
            if (filters.price[0] > 0) params.set('min_price', String(filters.price[0]))
            if (filters.price[1] < 100000) params.set('max_price', String(filters.price[1]))
        }

        if (filters.discount) params.set('discount', 'true')

        const queryString = params.toString()
        return queryString ? `/search?${queryString}` : '/search'
    }

    const validateForm = (): boolean => {
        const newErrors: { image?: boolean; filters?: boolean } = {}

        if (!imageFile && !editingBanner?.image_url) {
            newErrors.image = true
        }

        const hasFilters =
            (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) ||
            (filtersInfo.current.product_types && filtersInfo.current.product_types.length > 0) ||
            (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) ||
            (filtersInfo.current.bodytypes && filtersInfo.current.bodytypes.length > 0) ||
            (filtersInfo.current.price && filtersInfo.current.price[0] > 0) ||
            filtersInfo.current.discount

        if (!hasFilters) {
            newErrors.filters = true
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSaveBanner = async () => {
        if (!validateForm()) return

        setUploading(true)
        try {
            const bannerData = {
                image: imageFile,
                url: generateUrlFromFilters(filtersInfo.current),
                active: true,
            }
            if (editingBanner) {
                await updateAdminBanner(editingBanner.id, bannerData)
            } else {
                await createAdminBanner(bannerData)
            }
            loadBanners()
            setShowModal(false)
            setImageFile(null)
            setImagePreview('')
            setErrors({})
            filtersInfo.current = {
                sizes: [],
                price: [],
                firms: [],
                product_types: [],
                bodytypes: [],
                store: false,
                discount: false,
                withPrice: true,
                is_active: undefined
            }
        } catch (error) {
            console.error('Error saving banner:', error)
            alert('Ошибка при сохранении')
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteBanner = async (id: number) => {
        if (!confirm('Удалить баннер?')) return
        try {
            await deleteAdminBanner(id)
            loadBanners()
        } catch (error) {
            console.error('Error deleting banner:', error)
        }
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
            setErrors(prev => ({ ...prev, image: false }))
        }
    }

    const parseUrlToFilters = (url: string): any => {
        const filters = {
            sizes: [] as string[],
            price: [] as number[],
            firms: [] as number[], // ← теперь массив ID
            product_types: [] as number[],
            bodytypes: [] as string[],
            store: false,
            discount: false,
            withPrice: true,
            is_active: undefined
        }

        try {
            const urlObj = new URL(url, window.location.origin)
            const params = urlObj.searchParams

            const sizes = params.getAll('size')
            if (sizes.length) filters.sizes = sizes

            // Обработка фирм из URL (ИСПРАВЛЕНО)
            const firmSlugs = params.getAll('firm')
            if (firmSlugs.length) {
                filters.firms = firmSlugs
                    .map((slug: string) => firmMap[slug]?.id)
                    .filter(Boolean) as number[];
            }

            const bodytypes = params.getAll('bodytype')
            if (bodytypes.length) filters.bodytypes = bodytypes

            const minPrice = params.get('min_price')
            const maxPrice = params.get('max_price')
            if (minPrice || maxPrice) {
                filters.price = [
                    minPrice ? Number(minPrice) : 0,
                    maxPrice ? Number(maxPrice) : 100000
                ]
            }

            filters.discount = params.get('discount') === 'true'

            const types = params.getAll('type')
            if (types.length) {
                const typeIds = types.map(typeKey => {
                    const found = Object.entries(typesVal).find(([_, t]) => t.type_key === typeKey)
                    return found ? Number(found[0]) : null
                }).filter((id): id is number => !!id)
                filters.product_types = typeIds
            }

        } catch (error) {
            console.error('Error parsing URL:', error)
        }

        return filters
    }

    const openModal = (banner?: Banner) => {
        setErrors({})
        if (banner) {
            setEditingBanner(banner)
            filtersInfo.current = parseUrlToFilters(banner.link_url)
            setImagePreview(banner.image_url)
        } else {
            setEditingBanner(null)
            filtersInfo.current = {
                sizes: [],
                price: [],
                firms: [],
                product_types: [],
                bodytypes: [],
                store: false,
                discount: false,
                withPrice: true,
                is_active: undefined
            }
            setImagePreview('')
        }
        setImageFile(null)
        setShowModal(true)
        loadFilters()
    }

    const canAddMore = banners.length < 5

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление баннерами</h2>
                <div className={s.headerButtons}>
                    
                    {canAddMore && (
                        <Button text="+ Добавить баннер" onClick={() => openModal()} />
                    )}
                </div>
            </div>

            {!canAddMore && (
                <div className={s.limitWarning}>⚠️ Лимит 5 баннеров</div>
            )}

            <div className={s.bannersGrid}>
                {banners.map((banner, index) => (
                    <div key={banner.id} className={s.bannerCard}>
                        <div className={s.bannerImage}>
                            <img src={banner.image_url} alt={banner.title} />
                        </div>
                        <div className={s.bannerInfo}>
                            <h3>{banner.title || 'Баннер'}</h3>
                            <div className={s.bannerLink}>
                                <a href={banner.link_url} target="_blank">{banner.link_url}</a>
                            </div>
                        </div>
                        <div className={s.bannerActions}>
                            <button onClick={() => openModal(banner)}>✏️</button>
                            <button onClick={() => handleDeleteBanner(banner.id)}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal active={showModal} onChange={setShowModal}>
                <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                    <div className={s.modalHeader}>
                        <h3>{editingBanner ? 'Редактировать баннер' : 'Новый баннер'}</h3>

                        <button className={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                    </div>

                    <div className={s.formGroup}>
                        <label>Заголовок</label>
                        <input
                            type="text"
                            value={editingBanner?.title || ''}
                            onChange={e => setEditingBanner(prev => prev ? { ...prev, title: e.target.value } : { title: e.target.value } as Banner)}
                            placeholder="Например: Летняя распродажа"
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label>Изображение <span className={s.required}>*</span></label>
                        <div className={`${s.imageUpload} ${errors.image ? s.errorBorder : ''}`}>
                            {imagePreview ? (
                                <div className={s.imagePreview}>
                                    <img src={imagePreview} alt="Preview" />
                                    <button
                                        className={s.deleteImageBtn}
                                        onClick={(e) => {
                                            setImagePreview('')
                                            setImageFile(null)
                                        }}
                                    >
                                        <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <input type="file" accept="image/*" onChange={handleImageSelect} id="imageUpload" />
                                    <label htmlFor="imageUpload">Выбрать изображение</label>
                                </div>
                            )}
                        </div>
                        {errors.image && <div className={s.errorText}>Изображение обязательно</div>}
                    </div>

                    <div className={s.formGroup}>
                        <label>Условия показа <span className={s.required}>*</span></label>

                        <div
                            className={`${s.urlPreview} ${errors.filters ? s.errorBorder : ''}`}
                            onClick={() => setShowFiltersPanel(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            <strong>Ссылка для баннера:</strong>
                            <code>{generateUrlFromFilters(filtersInfo.current)}</code>
                            <span className={s.editHint}>✏️ нажмите чтобы настроить фильтры</span>
                        </div>

                        {errors.filters && <div className={s.errorText}>Выберите хотя бы один фильтр</div>}

                        <div className={s.filtersPreview}>
                            {filtersInfo.current.product_types?.length > 0 && (
                                <span>Тип: {filtersInfo.current.product_types
                                    .map((type: number) => typesVal[type]?.name)
                                    .filter(Boolean)
                                    .join(', ')}
                                </span>
                            )}
                            {filtersInfo.current.firms?.length > 0 && (
                                <span>Фирмы: {filtersInfo.current.firms
                                    .map((firmId: number) => {
                                        const firm = Object.values(firmMap).find(f => f.id === firmId);
                                        return firm?.name;
                                    })
                                    .filter(Boolean)
                                    .join(', ')}
                                </span>
                            )}
                            {filtersInfo.current.price && filtersInfo.current.price[0] > 0 && (
                                <span>Цена от {filtersInfo.current.price[0]}</span>
                            )}
                            {filtersInfo.current.discount && <span>Со скидкой</span>}
                            {!filtersInfo.current.product_types?.length &&
                                !filtersInfo.current.firms?.length &&
                                (!filtersInfo.current.price || filtersInfo.current.price[0] === 0) &&
                                !filtersInfo.current.discount && (
                                    <span className={s.emptyFilters}>❌ фильтры не выбраны</span>
                                )}
                        </div>
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

                {showFiltersPanel && (
                    <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
                        <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                            <div className={s.modalHeader}>
                                <h3>Выберите условия показа</h3>
                                <button onClick={() => setShowFiltersPanel(false)}>✕</button>
                            </div>
                            <ProductsFilters
                                onChange={onFiltersChange}
                                {...filtersState}
                            />
                            <div className={s.modalFooter}>
                                <Button text="Готово" onClick={() => setShowFiltersPanel(false)} />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default BannersManager