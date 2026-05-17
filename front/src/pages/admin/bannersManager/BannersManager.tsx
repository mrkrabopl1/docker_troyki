// pages/admin/Banners/BannersManager.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import Button from 'src/components/Button'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import s from "./style.module.css"
import { useAppSelector } from 'src/store/hooks/redux'
import { ReactComponent as Filter } from '/public/filter.svg'
import { getBannersAndFilters, getBanners, createAdminBanner, updateAdminBanner, deleteAdminBanner } from 'src/providers/adminBannersProvider'
import {
    getAdminProducts,
    VisibilityFilters,
} from 'src/providers/adminProductsProvider';
import { types } from 'src/store/reducers/menuSlice';
import Scroller from 'src/components/scroller/Scroller';

interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    is_active: boolean;
    sort_order: number;
    conditions: VisibilityFilters;
    created_at: string;
}

const BannersManager: React.FC = () => {
    const navigate = useNavigate();
    const { typesVal, categories } = useAppSelector(state => state.menuReducer);

    const filtersInfo = useRef<any>({
        sizes: [],
        price: [],
        product_types: [],
        bodytypes: [],
        firms: [],
        types: [],
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
        types: [],
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
    const [filtersState, setFilters] = useState<any>({
        priceProps: { max: 0, min: 0 },
        checboxsProps: [],
        soloDataProps: []
    })

    const activeSizes = useRef<string[]>([])
    const firms = useRef<string[]>([])

    // Конвертация фильтров для ProductsFilters
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
        const checkBoxPropsData: any[] = []

        if (resData.sizes) {
            Object.entries(resData.sizes).forEach(([size]) => {
                activeSizes.current.push(size)
                const active = filtersInfo.current.sizes?.includes(size) || false
                checkBoxPropsData.push({
                    enable: true,
                    activeData: active,
                    name: size
                })
            })
        }

        const checkBoxPropsProductsData: any[] = []
        if (resData.product_types) {
            resData.product_types.forEach((typeId: number) => {
                const typeDescr = typesVal[typeId];
                if (!typeDescr) return;
                const active = filtersInfo.current.types?.includes(typeId) || false
                checkBoxPropsProductsData.push({
                    enable: true,
                    activeData: active,
                    name: typeDescr.name
                })
            })
        }

        const checkBoxBodyTypesData: any[] = []
        if (resData.bodytypes) {
            Object.entries(resData.bodytypes).forEach(([bodytype]) => {
                const active = filtersInfo.current.bodytypes?.includes(bodytype) || false
                checkBoxBodyTypesData.push({
                    enable: true,
                    activeData: active,
                    name: bodytype
                })
            })
        }

        const checkBoxPropsFirmData: any[] = []
        Object.entries(resData.firmsCount || {}).forEach(([firm]) => {
            firms.current.push(firm)
            const active = filtersInfo.current.firms?.includes(firm) || false
            checkBoxPropsFirmData.push({
                enable: true,
                activeData: active,
                name: firm
            })
        })

        return {
            priceProps,
            checboxsProps: [
                { id: "sizes", name: "Размеры", props: checkBoxPropsData },
                { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
                { id: "type", name: "Типы товара", props: checkBoxPropsProductsData },
                { id: "bodytypes", name: "Форма тела", props: checkBoxBodyTypesData }
            ],
            soloDataProps: [
                { name: "На витрине", activeData: filtersInfo.current.is_active === true, enable: true },
                { name: "Скрытые", activeData: filtersInfo.current.is_active === false, enable: true },
                { name: "Со скидкой", activeData: filtersInfo.current.discount || false, enable: true }
            ]
        }
    }, [typesVal])

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

    useEffect(() => {
        if (Object.values(typesVal).length) {
            loadData()
        }
    }, [loadBanners, typesVal])

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getBannersAndFilters()
            setFilters(convertFiltersData(data.filters))
            setBanners(data.banners)
        } catch (error) {
            console.error('Error loading banners and filters:', error)
        } finally {
            setLoading(false)
        }
    }, [convertFiltersData])
    // Загрузка фильтров для конструктора
    const loadFilters = useCallback(async () => {
        try {
            // Используем существующий провайдер для получения фильтров
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



    // Обработка изменения фильтров
    const onFiltersChange = useCallback((filter: any) => {
        switch (filter.id) {
            case "sizes":
                filter.data.forEach((data: boolean, index: number) => {
                    const size = activeSizes.current[index]
                    // Обработка размеров одежды
                    const clothesIndex = filtersInfo.current.sizes.indexOf(size)
                    if (clothesIndex !== -1 && !data) {
                        filtersInfo.current.sizes.splice(clothesIndex, 1)
                    } else if (data && activeSizes.current.includes(size)) {
                        filtersInfo.current.sizes.push(size)
                    }

                    // Обработка размеров обуви
                    const snickersIndex = filtersInfo.current.sizes.indexOf(size)
                    if (snickersIndex !== -1 && !data) {
                        filtersInfo.current.sizes.splice(snickersIndex, 1)
                    } else if (data && activeSizes.current.includes(size)) {
                        filtersInfo.current.sizes.push(size)
                    }
                })
                break
            case "price":
                filtersInfo.current.price = filter.data
                break
            case "firms":
                filter.data.forEach((data: boolean, index: number) => {
                    const firm = firms.current[index]
                    const firmIndex = filtersInfo.current.firms?.indexOf(firm) || -1
                    if (firmIndex !== -1 && !data) {
                        filtersInfo.current.firms = filtersInfo.current.firms?.filter(f => f !== firm) || []
                    } else if (firmIndex === -1 && data) {
                        filtersInfo.current.firms = [...(filtersInfo.current.firms || []), firm]
                    }
                })
                break
            case "type":
                filter.data.forEach((data: boolean, index: number) => {
                    const product_type = allFilters.current.product_types[index]
                    const productTypeIndex = filtersInfo.current.product_types?.indexOf(product_type) || -1
                    if (productTypeIndex !== -1 && !data) {
                        filtersInfo.current.product_types = filtersInfo.current.product_types?.filter(pt => pt !== product_type) || []
                    } else if (productTypeIndex === -1 && data) {
                        filtersInfo.current.product_types = [...(filtersInfo.current.product_types || []), product_type]
                    }
                })
                break
            case "solo":
                if (filter.data[0]) filtersInfo.current.is_active = true
                else if (filter.data[1]) filtersInfo.current.is_active = false
                else filtersInfo.current.is_active = undefined
                filtersInfo.current.discount = filter.data[2]
                break
        }
    }, [])

    // Генерация URL из фильтров
    const generateUrlFromFilters = (filters: any): string => {
        const params = new URLSearchParams()

        // Для типов - обычно только один (категория/подкатегория)
        if (filters.product_types && filters.product_types.length > 0) {
            filters.product_types.forEach(product_type => {
                const type = typesVal[product_type]
                params.append('type', type.type_key)
            })
        }

        // Множественные фирмы
        if (filters.firms && filters.firms.length > 0) {
            filters.firms.forEach(firm => params.append('firm', firm))
        }

        // Множественные размеры
        if (filters.sizes && filters.sizes.length > 0) {
            filters.sizes.forEach(size => params.append('size', size))
        }

        // Множественные типы кузова
        if (filters.bodytypes && filters.bodytypes.length > 0) {
            filters.bodytypes.forEach(bodytype => params.append('bodytype', bodytype))
        }

        // Ценовой диапазон
        if (filters.price && filters.price.length === 2) {
            if (filters.price[0] > 0) params.set('min_price', String(filters.price[0]))
            if (filters.price[1] < 100000) params.set('max_price', String(filters.price[1]))
        }

        // Скидка
        if (filters.discount) params.set('discount', 'true')

        const queryString = params.toString()
        return queryString ? `/search?${queryString}` : '/search'
    }


    const handleSaveBanner = async () => {
        if (!imageFile && !editingBanner?.image_url) {
            alert('Выберите изображение')
            return
        }

        setUploading(true)
        try {
            const bannerData = {
                image: imageFile,
                url: generateUrlFromFilters(filtersInfo.current),
                active: true,
            }
            await createAdminBanner(bannerData)
            loadBanners()
            setShowModal(false)
            setImageFile(null)
            setImagePreview('')
            // Сбрасываем фильтры
            filtersInfo.current = {
                sizes: [],
                price: [],
                firms: [],
                types: [],
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
        }
    }
    const parseUrlToFilters = (url: string): any => {
        const filters = {
            sizes: [] as string[],
            price: [] as number[],
            firms: [] as string[],
            types: [] as number[],
            bodytypes: [] as string[],
            store: false,
            discount: false,
            withPrice: true,
            is_active: undefined
        }

        try {
            // Извлекаем query string из URL
            const urlObj = new URL(url, window.location.origin)
            const params = urlObj.searchParams

            // Парсим размеры
            const sizes = params.getAll('size')
            if (sizes.length) filters.sizes = sizes

            // Парсим фирмы
            const firms = params.getAll('firm')
            if (firms.length) filters.firms = firms

            // Парсим типы кузова
            const bodytypes = params.getAll('bodytype')
            if (bodytypes.length) filters.bodytypes = bodytypes

            // Парсим цену
            const minPrice = params.get('min_price')
            const maxPrice = params.get('max_price')
            if (minPrice || maxPrice) {
                filters.price = [
                    minPrice ? Number(minPrice) : 0,
                    maxPrice ? Number(maxPrice) : 100000
                ]
            }

            // Парсим скидку
            filters.discount = params.get('discount') === 'true'

            // Парсим тип товара (нужно преобразовать type_key обратно в ID)
            const types = params.getAll('type')
            if (types.length) {
                // Ищем ID типа по его ключу
                const typeIds = types.map(typeKey => {
                    const found = Object.entries(typesVal).find(([_, t]) => t.type_key === typeKey)
                    return found ? Number(found[0]) : null
                }).filter((id): id is number => !!id)
                filters.types = typeIds as number[]
            }

        } catch (error) {
            console.error('Error parsing URL:', error)
        }

        return filters
    }
    const openModal = (banner?: Banner) => {
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
                types: [],
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
                    <Button text="Назад" onClick={() => navigate('/admin')} />
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

            {/* Модальное окно с конструктором фильтров */}
            {showModal && (
                <div className={s.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>{editingBanner ? 'Редактировать баннер' : 'Новый баннер'}</h3>
                            <button onClick={() => setShowModal(false)}>✕</button>
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
                            <label>Изображение</label>
                            <div className={s.imageUpload}>
                                {imagePreview ? (
                                    <div className={s.imagePreview}>
                                        <img src={imagePreview} alt="Preview" />
                                        <button onClick={() => {
                                            setImagePreview('')
                                            setImageFile(null)
                                        }}>✕</button>
                                    </div>
                                ) : (
                                    <div>
                                        <input type="file" accept="image/*" onChange={handleImageSelect} id="imageUpload" />
                                        <label htmlFor="imageUpload">Выбрать изображение</label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={s.formGroup}>
                            <label>Условия показа (выберите фильтры)</label>

                            {/* Кликабельная ссылка для настройки фильтров */}
                            <div
                                className={s.urlPreview}
                                onClick={() => setShowFiltersPanel(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                <strong>Ссылка для баннера:</strong>
                                <code>{generateUrlFromFilters(filtersInfo.current)}</code>
                                <span className={s.editHint}>✏️ нажмите чтобы настроить фильтры</span>
                            </div>

                            {/* Превью выбранных фильтров */}
                            <div className={s.filtersPreview}>
                                {filtersInfo.current.types?.length > 0 && (
                                    <span>Тип: {typesVal[filtersInfo.current.types[0]]?.name}</span>
                                )}
                                {filtersInfo.current.firms?.length > 0 && (
                                    <span>Фирмы: {filtersInfo.current.firms.join(', ')}</span>
                                )}
                                {filtersInfo.current.price && filtersInfo.current.price[0] > 0 && (
                                    <span>Цена от {filtersInfo.current.price[0]}</span>
                                )}
                                {filtersInfo.current.discount && <span>Со скидкой</span>}
                                {!filtersInfo.current.types?.length &&
                                    !filtersInfo.current.firms?.length &&
                                    (!filtersInfo.current.price || filtersInfo.current.price[0] === 0) &&
                                    !filtersInfo.current.discount && (
                                        <span className={s.emptyFilters}>❌ фильтры не выбраны (баннер будет показан всем)</span>
                                    )}
                            </div>
                        </div>

                        <div className={s.modalActions}>
                            <Button text="Отмена" onClick={() => setShowModal(false)} />
                            <Button text={uploading ? 'Сохранение...' : 'Сохранить'} onClick={handleSaveBanner} disabled={uploading} />
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно фильтров - как в AdminProductVisibility */}
            {showFiltersPanel && (
                <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
                    <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Выберите условия показа</h3>
                            <button onClick={() => setShowFiltersPanel(false)}>✕</button>
                        </div>
                        <Scroller>
                            <ProductsFilters
                                memo={true}
                                onChange={onFiltersChange}
                                {...filtersState}
                            />
                        </Scroller>

                        <div className={s.modalFooter}>
                            <Button text="Готово" onClick={() => setShowFiltersPanel(false)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default BannersManager