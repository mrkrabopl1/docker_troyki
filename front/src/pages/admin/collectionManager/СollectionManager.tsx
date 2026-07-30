// pages/admin/Collections/CollectionsManager.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Button from 'src/components/Button'
import Modal from 'src/components/modal/Modal'
import ProductsFilters from 'src/modules/settingsPanels/ProductsFilters'
import ProductSelector from 'src/modules/merchField/ProductSelector'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { CheckBoxType, Collection } from 'src/types/modules'
import {
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,
} from 'src/providers/adminCollectionProvider'
import { getAdminProductsAndFilters, getAdminProducts } from 'src/providers/adminProductsProvider'
import { finishLoading } from 'src/store/reducers/loadingSlice'
import { BODY_TYPES } from 'src/constants/bodytypes'
import Scroller from 'src/components/scroller/Scroller'
import s from './style.module.css'

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
    variationGroups?: VariationFilterGroup[] // Добавляем вариационные группы
}

// Интерфейс для вариационной группы
interface VariationFilterGroup {
    id: string; // Уникальный идентификатор группы (например, "lines", "firms")
    name: string; // Название группы (например, "Линии", "Фирмы")
    options: VariationOption[]; // Массив опций для выбора
}

// Интерфейс для опции вариации
interface VariationOption {
    id: string; // Уникальный идентификатор опции
    name: string; // Название опции
    props: CheckBoxType[]; // Дополнительные чекбоксы внутри опции (если нужны)
}

const CollectionsManager: React.FC = () => {
    const { typesVal, firmMap, lineMap } = useAppSelector(state => state.menuReducer)
    const dispatch = useAppDispatch();
    const [filtersVersion, setFiltersVersion] = useState(0)

    // Коллекции
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showFiltersPanel, setShowFiltersPanel] = useState(false) // 👈 ДОБАВИЛИ
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null)

    // Форма
    const [slug, setSlug] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<'dynamic' | 'manual' | 'hybrid'>('dynamic')
    const [isActive, setIsActive] = useState(true)
    const [sortOrder, setSortOrder] = useState(0)

    // Для разных режимов
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

    // Фильтры
    const filtersInfo = useRef<{
        sizes: string[]
        firms: number[]
        types: number[]
        price: [number, number]
        rule_ids: number[]
        in_store: boolean,
        bodytypes: string[],
        lines?: number[],
    }>({
        sizes: [],
        firms: [],
        lines:[],
        types: [],
        price: [0, 100000],
        rule_ids: [],
        in_store: false,
        bodytypes: []
    })

    const [filtersState, setFiltersState] = useState<FiltersState>({
        priceProps: { min: 0, max: 100000, dataLeft: 0, dataRight: 100000 },
        checboxsProps: [],
        soloDataProps: []
    })

    const [previewProducts, setPreviewProducts] = useState<any[]>([])
    const [previewTotal, setPreviewTotal] = useState(0)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [errors, setErrors] = useState<{ filters?: boolean }>({})

    // ===== Состояние для ProductSelector =====
    const [selectorProducts, setSelectorProducts] = useState<any[]>([])
    const [selectorLoading, setSelectorLoading] = useState(false)
    const [selectorTotal, setSelectorTotal] = useState(0)
    const [selectorSearch, setSelectorSearch] = useState('')
    const selectorPage = useRef(1)
    const pageSize = 20
    const searchTimeoutRef = useRef<any>()
    const validateForm = (): boolean => {
        // 1. Проверка обязательных полей
        if (!slug.trim() || !name.trim()) {
            alert('Заполните все обязательные поля (Slug и Название)')
            return false
        }

        // 2. Проверка slug (только латиница, цифры, дефис)
        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(slug)) {
            alert('Slug должен содержать только латинские буквы, цифры и дефис')
            return false
        }

        // 3. Валидация в зависимости от типа коллекции
        switch (type) {
            case 'dynamic':
                // Для динамической: нужны фильтры (типы ИЛИ бренды ИЛИ размеры ИЛИ цены ИЛИ скидки ИЛИ наличие)
                const hasDynamicFilters =
                    (filtersInfo.current.types && filtersInfo.current.types.length > 0) ||
                    (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) ||
                    (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) ||
                    (filtersInfo.current.price && filtersInfo.current.price[0] > 0) ||
                    (filtersInfo.current.rule_ids && filtersInfo.current.rule_ids.length > 0) ||
                    (filtersInfo.current.in_store === true) ||
                    (filtersInfo.current.bodytypes && filtersInfo.current.bodytypes.length > 0)

                if (!hasDynamicFilters) {
                    alert('Для динамической коллекции нужно выбрать хотя бы один фильтр (типы, бренды, размеры, цены, скидки, наличие или bodytype)')
                    return false
                }
                break

            case 'manual':
                // Для ручной: нужны выбранные товары
                if (selectedProductIds.length === 0) {
                    alert('Для ручной коллекции нужно выбрать хотя бы один товар')
                    return false
                }
                if (selectedProductIds.length > 500) {
                    alert('В коллекцию можно добавить не более 500 товаров')
                    return false
                }
                break

            case 'hybrid':
                // Для гибридной: нужны ИЛИ фильтры, ИЛИ товары
                const hasHybridFilters =
                    (filtersInfo.current.types && filtersInfo.current.types.length > 0) ||
                    (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) ||
                    (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) ||
                    (filtersInfo.current.price && filtersInfo.current.price[0] > 0) ||
                    (filtersInfo.current.rule_ids && filtersInfo.current.rule_ids.length > 0) ||
                    (filtersInfo.current.in_store === true) ||
                    (filtersInfo.current.bodytypes && filtersInfo.current.bodytypes.length > 0)

                const hasHybridProducts = selectedProductIds.length > 0

                if (!hasHybridFilters && !hasHybridProducts) {
                    alert('Для гибридной коллекции нужно выбрать хотя бы один фильтр ИЛИ хотя бы один товар')
                    return false
                }

                if (selectedProductIds.length > 500) {
                    alert('В коллекцию можно добавить не более 500 товаров')
                    return false
                }
                break

            default:
                alert('Неизвестный тип коллекции')
                return false
        }

        // 4. Проверка на дубликат slug (если редактирование - проверяем что slug не занят другой коллекцией)
        const slugExists = collections.some(c =>
            c.slug === slug && c.id !== editingCollection?.id
        )
        if (slugExists) {
            alert('Коллекция с таким slug уже существует')
            return false
        }

        return true
    }
    // Конвертация фильтров
    const convertFiltersData = useCallback((resData: any) => {
        if (!resData) return

        const priceProps = {
            min: resData.price?.[0] || 0,
            max: resData.price?.[1] || 100000,
            dataLeft: filtersInfo.current.price?.[0] || resData.price?.[0] || 0,
            dataRight: filtersInfo.current.price?.[1] || resData.price?.[1] || 100000
        }

        const sizesList = resData.sizes ? Object.keys(resData.sizes) : []
        const typesList = resData.types || []
        const discountsList = resData.discounts || []

        const checkBoxPropsData: CheckBoxType[] = sizesList.map(size => ({
            id: size,
            enable: true,
            activeData: filtersInfo.current.sizes?.includes(size) || false,
            name: size
        }))

        const checkBoxPropsTypeData: CheckBoxType[] = typesList.map((typeId: number) => ({
            id: typeId,
            enable: true,
            activeData: filtersInfo.current.types?.includes(typeId) || false,
            name: typesVal[typeId]?.name || `Тип ${typeId}`
        }))

        const checkBoxPropsDiscountData: CheckBoxType[] = discountsList.map((discount: any) => ({
            id: discount.id,
            enable: true,
            activeData: filtersInfo.current.rule_ids?.includes(discount.id) || false,
            name: discount.name
        }))

        const checkBoxPropsBodyData: CheckBoxType[] = []
        if (resData.bodytypes) {
            Object.entries(resData.bodytypes).forEach(([body, count]) => {
                const active = filtersInfo.current.bodytypes.includes(body);
                checkBoxPropsBodyData.push({
                    id: body,
                    enable: true,
                    activeData: active,
                    name: `${BODY_TYPES[body]}`
                });
            });
        }

        // Формируем данные для линий
        const checkBoxPropsLineData: CheckBoxType[] = []
        Object.values(lineMap).forEach((line) => {
            const active = filtersInfo.current.lines.includes(line.id);
            checkBoxPropsLineData.push({
                id: line.id,
                enable: true,
                activeData: active,
                name: `${line.name}`
            });
        });

        // Формируем данные для фирм
        const checkBoxPropsFirmData: CheckBoxType[] = Object.values(firmMap)
            .map((firm: any) => {
                return {
                    id: firm.id,
                    enable: true,
                    activeData: filtersInfo.current.firms?.includes(firm.id) || false,
                    name: firm.name
                }
            })
            .filter(Boolean) as CheckBoxType[]

        // СОЗДАЕМ ОДНУ ГРУППУ с двумя опциями: Линии и Фирмы
        const variationGroups = [];

        // Проверяем, есть ли данные для линий или фирм
        if (checkBoxPropsLineData.length > 0 || checkBoxPropsFirmData.length > 0) {
            const options: VariationOption[] = [];

            // Добавляем опцию "Линии" с чекбоксами линий
            if (checkBoxPropsLineData.length > 0) {
                options.push({
                    id: "lines_option",
                    name: "Линии",
                    props: checkBoxPropsLineData // Все чекбоксы линий
                });
            }

            // Добавляем опцию "Фирмы" с чекбоксами фирм
            if (checkBoxPropsFirmData.length > 0) {
                options.push({
                    id: "firms_option",
                    name: "Фирмы",
                    props: checkBoxPropsFirmData // Все чекбоксы фирм
                });
            }

            // Создаем одну группу с двумя опциями
            variationGroups.push({
                id: "catalog_filter", // Уникальный ID группы
                name: "Каталог", // Название группы (будет отображаться в DoubleInfoDrop)
                options: options // Две опции: Линии и Фирмы
            });
        }

        // Обычные чекбоксы (убираем firms и lines, так как они теперь в вариациях)
        const checboxsProps = [
            { id: "sizes", name: "Размеры", props: checkBoxPropsData },
            { id: "type", name: "Типы товара", props: checkBoxPropsTypeData },
            { id: "bodytypes", name: "Телосложение", props: checkBoxPropsBodyData },
        ]

        if (discountsList.length > 0) {
            checboxsProps.push({ id: "discounts", name: "Скидки", props: checkBoxPropsDiscountData })
        }

        const soloDataProps: CheckBoxType[] = [
            {
                id: 'in_store',
                enable: true,
                activeData: filtersInfo.current.in_store || false,
                name: "На витрине"
            }
        ]

        setFiltersState({
            priceProps,
            checboxsProps,
            soloDataProps,
            variationGroups // Одна группа с двумя опциями
        })
    }, [typesVal, firmMap])
    // Загрузка фильтров
    const loadFilters = useCallback(async () => {
        try {
            await getAdminProductsAndFilters(
                (data: any) => {
                    if (data.filters) {
                        convertFiltersData(data.filters)
                    }
                    if (data.products) {
                        setPreviewProducts(data.products?.slice(0, 20) || [])
                        setPreviewTotal(data.totalCount || 0)
                    }
                },
                1,
                20,
                0
            )
        } catch (error) {
            console.error('Error loading filters:', error)
        }
    }, [convertFiltersData])

    // Обновление предпросмотра
    const updatePreview = useCallback(async () => {
        if (type === 'manual') return

        setPreviewLoading(true)
        try {
            const params = {
                sizes: filtersInfo.current.sizes || [],
                firms: filtersInfo.current.firms || [],
                types: filtersInfo.current.types || [],
                price: filtersInfo.current.price || [0, 100000],
                rule_ids: filtersInfo.current.rule_ids || [],
                bodytypes: filtersInfo.current.bodytypes || [],
                in_store: filtersInfo.current.in_store || false,
                withPrice: true
            }

            await getAdminProducts(
                (data: any) => {
                    setPreviewProducts(data.products?.slice(0, 20) || [])
                    setPreviewTotal(data.totalCount || 0)
                },
                1,
                20,
                params,
                0,
                ''
            )
        } catch (error) {
            console.error('Preview error:', error)
        } finally {
            setPreviewLoading(false)
        }
    }, [type])

    // Обработчик изменения фильтров
    const onFiltersChange = useCallback((filter: any) => {
        switch (filter.id) {
            case "sizes":
                filtersInfo.current.sizes = filter.data || []
                break
            case "firms":
                filtersInfo.current.firms = (filter.data || [])
                    .map((slug: string) => firmMap[slug]?.id)
                    .filter(Boolean) as number[]
                break
            case "type":
                filtersInfo.current.types = filter.data || []
                break
            case "discounts":
                filtersInfo.current.rule_ids = filter.data || []
                break
            case "bodytypes":
                filtersInfo.current.bodytypes = filter.data || []
                break
            case "price":
                filtersInfo.current.price = filter.data || [0, 100000]
                break
            case "solo":
                if (filter.data && filter.data.length > 0) {
                    const inStoreItem = filter.data.find((item: CheckBoxType) => item.id === 'in_store')
                    filtersInfo.current.in_store = inStoreItem ? inStoreItem.activeData : false
                }
                break
            // Обработка вариационных групп
            case "variation_catalog_filter":
                // Переключение между Линиями и Фирмами
                const { selectedOptionId } = filter.data;
                console.log('Переключение на:', selectedOptionId);

                // Очищаем предыдущие фильтры при переключении
                if (selectedOptionId === 'lines_option') {
                    // Очищаем фильтры фирм, так как переключились на линии
                    filtersInfo.current.firms = [];
                } else if (selectedOptionId === 'firms_option') {
                    // Очищаем фильтры линий, так как переключились на фирмы
                    filtersInfo.current.lines = [];
                }
                break

            case "variation_checkbox_catalog_filter":
                // Изменение чекбоксов внутри выбранной опции
                const { optionId, selectedCheckboxes } = filter.data;

                if (optionId === 'lines_option') {
                    // Обновляем фильтр линий
                    filtersInfo.current.lines = selectedCheckboxes || [];
                } else if (optionId === 'firms_option') {
                    // Обновляем фильтр фирм
                    // Преобразуем слаги в ID
                    filtersInfo.current.firms = (selectedCheckboxes || [])
                        .map((slug: string) => firmMap[slug]?.id)
                        .filter(Boolean) as number[];
                }
                break

            default:
                break
        }
        setFiltersVersion(prev => prev + 1)
        setErrors(prev => ({ ...prev, filters: false }))
        updatePreview()
    }, [updatePreview, firmMap])

    // Загрузка товаров для селектора
    const loadSelectorProducts = useCallback(async () => {
        if (!showModal) return
        if (type === 'dynamic') return

        setSelectorLoading(true)
        try {
            const handleData = (data: any) => {
                setSelectorProducts(data.products || [])
                setSelectorTotal(data.totalCount || 0)
                setSelectorLoading(false)
            }

            await getAdminProducts(
                handleData,
                selectorPage.current,
                pageSize,
                {},
                0,
                selectorSearch,
            )
        } catch (error) {
            console.error('Error loading products:', error)
            setSelectorLoading(false)
        }
    }, [selectorSearch, showModal, type])

    // Загружаем при открытии модалки
    useEffect(() => {
        if (showModal) {
            if (type === 'dynamic' || type === 'hybrid') {
                loadFilters()
                updatePreview()
            }
            if (type === 'manual' || type === 'hybrid') {
                selectorPage.current = 1
                loadSelectorProducts()
            }
        }
    }, [showModal, type, loadFilters, updatePreview, loadSelectorProducts])

    const handleSelectorSearch = (query: string) => {
        setSelectorSearch(query)
        selectorPage.current = 1
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = setTimeout(() => {
            loadSelectorProducts()
        }, 300)
    }

    const handleLoadMore = () => {
        if (selectorProducts.length < selectorTotal) {
            selectorPage.current += 1
            loadSelectorProducts()
        }
    }

    const loadCollections = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getCollections()
            setCollections(data)
            dispatch(finishLoading())
        } catch (error) {
            console.error('Error loading collections:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCollections()
    }, [loadCollections])

    const resetForm = () => {
        setSlug('')
        setName('')
        setDescription('')
        setType('dynamic')
        setIsActive(true)
        setSortOrder(collections.length)
        setSelectedProductIds([])
        filtersInfo.current = {
            sizes: [],
            firms: [],
            types: [],
            price: [0, 100000],
            rule_ids: [],
            in_store: false,
            lines:[],
            bodytypes: []
        }
        setFiltersState({
            priceProps: { min: 0, max: 100000, dataLeft: 0, dataRight: 100000 },
            checboxsProps: [],
            soloDataProps: []
        })
        setPreviewProducts([])
        setPreviewTotal(0)
        setErrors({})
        setFiltersVersion(prev => prev + 1)
        setEditingCollection(null)
        setSelectorProducts([])
        setSelectorTotal(0)
        setSelectorSearch('')
        setShowFiltersPanel(false)
        selectorPage.current = 1
    }

    const openModal = (collection?: Collection) => {
        if (collection) {
            setEditingCollection(collection)
            setSlug(collection.slug)
            setName(collection.name)
            setDescription(collection.description || '')
            setType(collection.type as any)
            setIsActive(collection.is_active)

            if (collection.settings?.filters) {
                const f = collection.settings.filters
                filtersInfo.current = {
                    sizes: f.sizes || [],
                    firms: f.firms || [],
                    types: f.types || [],
                    lines: f.lines || [],
                    price: f.price || [0, 100000],
                    rule_ids: f.rule_ids || [],
                    bodytypes: f.bodytypes || [],
                    in_store: f.in_store || false
                }
            } else {
                filtersInfo.current = {
                    sizes: [],
                    firms: [],
                    types: [],
                    lines:[],
                    price: [0, 100000],
                    rule_ids: [],
                    bodytypes: [],
                    in_store: false
                }
            }

            if (collection.type === 'manual' || collection.type === 'hybrid') {
                setSelectedProductIds(collection.settings?.product_ids || [])
            }

            setShowModal(true)
        } else {
            resetForm()
            setShowModal(true)
        }
    }
    // Полная валидация для всех типов коллекций


    // Использование в handleSave:
    const handleSave = async () => {
        if (!validateForm()) return

        const data = {
            slug,
            name,
            description,
            type,
            is_active: isActive,
            settings: {
                filters: type !== 'manual' ? {
                    types: filtersInfo.current.types || [],
                    firms: filtersInfo.current.firms || [],
                    lines: filtersInfo.current.lines || [],
                    bodytypes: filtersInfo.current.bodytypes || [],
                    sizes: filtersInfo.current.sizes || [],
                    price: filtersInfo.current.price || [0, 100000],
                    rule_ids: filtersInfo.current.rule_ids || [],
                    in_store: filtersInfo.current.in_store || false
                } : undefined,
                product_ids: type !== 'dynamic' ? selectedProductIds : undefined
            }
        }

        try {
            if (editingCollection?.id) {
                await updateCollection(editingCollection.id, data)
            } else {
                await createCollection(data)
            }
            await loadCollections()
            setShowModal(false)
            resetForm()
        } catch (error) {
            console.error('Save error:', error)
            alert('Ошибка при сохранении')
        }
    }
    const handleDelete = async (id: number) => {
        if (!confirm('Удалить коллекцию?')) return
        try {
            await deleteCollection(id)
            await loadCollections()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const getFiltersSummary = useMemo(() => {
        const parts: string[] = []

        if (filtersInfo.current.types && filtersInfo.current.types.length > 0) {
            const typeNames = filtersInfo.current.types
                .map(typeId => typesVal[typeId]?.name)
                .filter(Boolean)
                .join(', ')
            if (typeNames) parts.push(`Тип: ${typeNames}`)
        }

        if (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) {
            const firmNames = filtersInfo.current.firms
                .map(firmId => {
                    const firm = Object.values(firmMap).find(f => f.id === firmId)
                    return firm?.name || null
                })
                .filter(Boolean)
                .join(', ')
            if (firmNames) parts.push(`Фирмы: ${firmNames}`)
        }

        if (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) {
            parts.push(`Размеры: ${filtersInfo.current.sizes.join(', ')}`)
        }

        if (filtersInfo.current.rule_ids && filtersInfo.current.rule_ids.length > 0) {
            parts.push(`Скидки: ${filtersInfo.current.rule_ids.length} правил`)
        }
        if (filtersInfo.current.bodytypes && filtersInfo.current.bodytypes.length > 0) {
            parts.push(`Телосложение: ${filtersInfo.current.bodytypes.length} правил`)
        }
        if (filtersInfo.current.price && filtersInfo.current.price[0] > 0) {
            parts.push(`Цена от ${filtersInfo.current.price[0]}`)
        }
        if (filtersInfo.current.price && filtersInfo.current.price[1] < 100000) {
            parts.push(`до ${filtersInfo.current.price[1]}`)
        }

        if (filtersInfo.current.in_store) {
            parts.push('Только на витрине')
        }

        return parts.length > 0 ? parts.join('; ') : 'Условия не выбраны'
    }, [filtersVersion, typesVal, firmMap, filtersInfo.current, editingCollection])

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление коллекциями</h2>
                <Button text="+ Создать коллекцию" onClick={() => openModal()} />
            </div>

            {loading ? (
                <div className={s.loader}>Загрузка...</div>
            ) : collections.length === 0 ? (
                <div className={s.emptyState}>Нет коллекций. Создайте первую коллекцию!</div>
            ) : (
                <div className={s.collectionsGrid}>
                    {collections.map((col) => (
                        <div key={col.id} className={`${s.collectionCard} ${!col.is_active ? s.inactive : ''}`}>
                            <div className={s.collectionInfo}>
                                <h3>{col.name}</h3>
                                <div className={s.collectionMeta}>
                                    <span>Slug: {col.slug}</span>
                                    <span className={`${s.typeBadge} ${s[col.type]}`}>
                                        {col.type === 'dynamic' ? 'Динамическая' :
                                            col.type === 'manual' ? 'Ручная' : 'Гибридная'}
                                    </span>
                                    <span className={col.is_active ? s.active : s.inactive}>
                                        {col.is_active ? 'Активна' : 'Неактивна'}
                                    </span>
                                </div>
                                {col.description && (
                                    <p className={s.description}>{col.description}</p>
                                )}
                            </div>
                            <div className={s.collectionActions}>
                                <button className={s.editBtn} onClick={() => openModal(col)}>✏️</button>
                                <button className={s.deleteBtn} onClick={() => handleDelete(col.id!)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модалка */}
            <Modal active={showModal} onChange={setShowModal}>
                <div onClick={e => e.stopPropagation()} className={s.modalContent}>
                    <div className={s.modalHeader}>
                        <h3>{editingCollection ? 'Редактировать коллекцию' : 'Новая коллекция'}</h3>
                        <button className={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                    </div>

                    <div className={s.formGroup}>
                        <label>Slug *</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                            placeholder="collection-slug"
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label>Название *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Название коллекции"
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label>Описание</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Описание коллекции"
                            rows={3}
                        />
                    </div>

                    <div className={s.formGroup}>
                        <label>Тип коллекции</label>
                        <select value={type} onChange={e => setType(e.target.value as any)}>
                            <option value="dynamic">Динамическая (по фильтрам)</option>
                            <option value="manual">Ручная (выбор товаров)</option>
                            <option value="hybrid">Гибридная (фильтры + ручной выбор)</option>
                        </select>
                    </div>

                    {type !== 'manual' && (
                        <div className={s.formGroup}>
                            <label>Фильтры</label>
                            <div
                                className={`${s.filtersPreview} ${errors.filters ? s.errorBorder : ''}`}
                                onClick={() => {
                                    console.debug(";dsa;md;as")
                                    setShowFiltersPanel(true)
                                }
                                }
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={s.filtersSummary}>
                                    {getFiltersSummary}
                                </div>
                                <span className={s.editHint}>✏️ нажмите чтобы настроить</span>
                            </div>
                            {errors.filters && <div className={s.errorText}>Выберите хотя бы один фильтр</div>}

                            {/* Предпросмотр для dynamic и hybrid */}
                            {(type === 'dynamic' || type === 'hybrid') && (
                                <div className={s.previewSection}>
                                    <h4>Предпросмотр товаров</h4>
                                    {previewLoading ? (
                                        <div className={s.loader}>Загрузка...</div>
                                    ) : (
                                        <>
                                            <div className={s.previewStats}>
                                                Найдено: <strong>{previewTotal}</strong>
                                            </div>
                                            <div className={s.productsGrid}>
                                                {previewProducts.slice(0, 8).map(p => (
                                                    <div key={p.id} className={s.previewProduct}>
                                                        {p.image_path && (
                                                            <img src={p.image_path} alt={p.name} />
                                                        )}
                                                        <div className={s.productName}>{p.name}</div>
                                                    </div>
                                                ))}
                                                {previewTotal > 8 && <div className={s.more}>+ ещё {previewTotal - 8}</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {type !== 'dynamic' && (
                        <div className={s.formGroup}>
                            <label>Товары</label>
                            <ProductSelector
                                products={selectorProducts}
                                selectedIds={selectedProductIds}
                                onChange={setSelectedProductIds}
                                isLoading={selectorLoading}
                                total={selectorTotal}
                                searchQuery={selectorSearch}
                                onSearch={handleSelectorSearch}
                                onLoadMore={handleLoadMore}
                                multiple={true}
                                maxItems={500}
                                placeholder="Поиск товаров для добавления..."
                            />
                            <div className={s.selectedCount}>
                                Выбрано: <strong>{selectedProductIds.length}</strong> товаров
                            </div>
                        </div>
                    )}

                    <div className={s.formGroup}>
                        <label className={s.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                            />
                            Активна
                        </label>
                    </div>

                    <div className={s.modalActions}>
                        <Button text="Отмена" onClick={() => setShowModal(false)} />
                        <Button text="Сохранить" onClick={handleSave} />
                    </div>
                </div>
                {showFiltersPanel && (
                    <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
                        <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                            <div className={s.modalHeader}>
                                <h3>Выберите условия показа</h3>
                                <button onClick={() => setShowFiltersPanel(false)}>✕</button>
                            </div>
                            <Scroller>
                                <ProductsFilters
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
            </Modal>
        </div>
    )
}

export default CollectionsManager