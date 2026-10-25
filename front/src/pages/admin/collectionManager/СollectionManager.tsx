// pages/admin/Collections/CollectionsManager.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Button from 'src/components/Button'
import Modal from 'src/components/modal/Modal'
import ProductsFilters from 'src/modules/settingsPanels/ProductsFilters'
import ProductSelector from 'src/modules/merchField/ProductSelector'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { CheckBoxType, Collection, EditCollection } from 'src/types/modules'
import {
    getCollectionById
} from 'src/providers/collectionsProvider'
import {
    getCollection,
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    uploadCollectionCover, // NEW
} from 'src/providers/adminCollectionProvider'
import { getAdminProductsAndFilters, getAdminProducts } from 'src/providers/adminProductsProvider'
import { getProductsByIds } from 'src/providers/merchProvider'
import { finishLoading } from 'src/store/reducers/loadingSlice'
import { BODY_TYPES } from 'src/constants/bodytypes'
import Scroller from 'src/components/scroller/Scroller'
import s from './style.module.css'
// NEW: типы отображения
import {
    COLLECTION_TYPES,
    CollectionType,
    DISPLAY_TYPES,
    DisplayType,
} from 'src/types/adminProduct';
import Combobox from 'src/components/combobox/Combobox'
import deleteIconUrl from '/public/delete.svg'; // NEW

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
    variationGroups?: VariationFilterGroup[]
}

interface VariationFilterGroup {
    id: string;
    name: string;
    options: VariationOption[];
}

interface VariationOption {
    id: string;
    name: string;
    props: CheckBoxType[];
}

interface SelectedProduct {
    id: number;
    name: string;
    article: string;
    price: number;
    old_price?: number;
    firm: string;
    image_path?: string;
    status: string;
}

// NEW: подписи для display_type
const DISPLAY_TYPE_OPTIONS: Record<number, string> = {
    [DISPLAY_TYPES.SHORT]: 'Краткий (без описания)',
    [DISPLAY_TYPES.DETAILED]: 'Подробный (с описанием и годом)',
};

const CollectionsManager: React.FC = () => {
    const { typesVal, firmMap, lineMap } = useAppSelector(state => state.menu)
    const dispatch = useAppDispatch();
    const [filtersVersion, setFiltersVersion] = useState(0)

    // Коллекции
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showFiltersPanel, setShowFiltersPanel] = useState(false)
    const [editingCollection, setEditingCollection] = useState<EditCollection | null>(null)
    const [loadingCollection, setLoadingCollection] = useState(false)

    // Форма
    const [slug, setSlug] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<CollectionType>(COLLECTION_TYPES.DYNAMIC);
    const [isActive, setIsActive] = useState(true)

    // NEW: display_type и cover_image_url
    const [displayType, setDisplayType] = useState<DisplayType>(DISPLAY_TYPES.DETAILED) // default full
    const [coverImageUrl, setCoverImageUrl] = useState('')
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState('')
    const [coverUploading, setCoverUploading] = useState(false)
    const coverFileInputRef = useRef<HTMLInputElement>(null)

    // Для разных режимов
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])

    // Пагинация для выбранных товаров
    const [selectedPage, setSelectedPage] = useState(1)

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
        lines: [],
        types: [],
        price: [0, 100000],
        rule_ids: [],
        in_store: false,
        bodytypes: []
    })

    const filtersInfoForManual = useRef<{
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
        lines: [],
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
    const [selectorCurrentPage, setSelectorCurrentPage] = useState(1)
    const [selectorSearch, setSelectorSearch] = useState('')
    const [selectorViewMode, setSelectorViewMode] = useState<'all' | 'selected'>('all')
    const [selectedViewProducts, setSelectedViewProducts] = useState<any[]>([])
    const [selectedViewLoading, setSelectedViewLoading] = useState(false)
    const selectorPage = useRef(1)
    const pageSize = 20
    const searchTimeoutRef = useRef<any>()

    const validateForm = (): boolean => {
        if (!slug.trim() || !name.trim()) {
            alert('Заполните все обязательные поля (Slug и Название)')
            return false
        }

        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(slug)) {
            alert('Slug должен содержать только латинские буквы, цифры и дефис')
            return false
        }

        switch (type) {
            case 'dynamic': {
                const hasDynamicFilters =
                    (filtersInfo.current.types && filtersInfo.current.types.length > 0) ||
                    (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) ||
                    (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) ||
                    (filtersInfo.current.price && filtersInfo.current.price[0] > 0) ||
                    (filtersInfo.current.rule_ids && filtersInfo.current.rule_ids.length > 0) ||
                    (filtersInfo.current.in_store === true) ||
                    (filtersInfo.current.bodytypes && filtersInfo.current.bodytypes.length > 0)

                if (!hasDynamicFilters) {
                    alert('Для динамической коллекции нужно выбрать хотя бы один фильтр')
                    return false
                }
                break
            }

            case 'manual':
                if (selectedProductIds.length === 0) {
                    alert('Для ручной коллекции нужно выбрать хотя бы один товар')
                    return false
                }
                if (selectedProductIds.length > 500) {
                    alert('В коллекцию можно добавить не более 500 товаров')
                    return false
                }
                break

            case 'hybrid': {
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
            }

            default:
                alert('Неизвестный тип коллекции')
                return false
        }

        const slugExists = collections.some(c =>
            c.slug === slug && c.id !== editingCollection?.collection?.id
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

        const checkBoxPropsLineData: CheckBoxType[] = []
        Object.values(lineMap).forEach((line) => {
            const active = filtersInfo.current.lines?.includes(line.id) || false;
            checkBoxPropsLineData.push({
                id: line.id,
                enable: true,
                activeData: active,
                name: `${line.name}`
            });
        });

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

        const variationGroups = [];

        if (checkBoxPropsLineData.length > 0 || checkBoxPropsFirmData.length > 0) {
            const options: VariationOption[] = [];

            if (checkBoxPropsLineData.length > 0) {
                options.push({
                    id: "lines_option",
                    name: "Линии",
                    props: checkBoxPropsLineData
                });
            }

            if (checkBoxPropsFirmData.length > 0) {
                options.push({
                    id: "firms_option",
                    name: "Фирмы",
                    props: checkBoxPropsFirmData
                });
            }

            variationGroups.push({
                id: "catalog_filter",
                name: "Каталог",
                options: options
            });
        }

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
            variationGroups
        })
    }, [typesVal, firmMap, lineMap])

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
                lines: filtersInfo.current.lines || [],
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
            case "variation_catalog_filter": {
                const { selectedOptionId } = filter.data;
                if (selectedOptionId === 'lines_option') {
                    filtersInfo.current.firms = [];
                } else if (selectedOptionId === 'firms_option') {
                    filtersInfo.current.lines = [];
                }
                break
            }
            case "variation_checkbox_catalog_filter": {
                const { optionId, selectedCheckboxes } = filter.data;
                if (optionId === 'lines_option') {
                    filtersInfo.current.lines = selectedCheckboxes || [];
                } else if (optionId === 'firms_option') {
                    filtersInfo.current.firms = (selectedCheckboxes || [])
                        .map((slug: string) => firmMap[slug]?.id)
                        .filter(Boolean) as number[];
                }
                break
            }
            default:
                break
        }
        setFiltersVersion(prev => prev + 1)
        setErrors(prev => ({ ...prev, filters: false }))
        updatePreview()
    }, [updatePreview, firmMap])

    // Загрузка товаров для селектора
    const loadSelectorProducts = useCallback(async (searchQuery?: string) => {
        if (!showModal || type === 'dynamic') return

        setSelectorLoading(true)
        try {
            const query = searchQuery !== undefined ? searchQuery : selectorSearch
            if (selectorViewMode === "all") {
                await getAdminProducts(
                    (data: any) => {
                        setSelectorProducts(data.products || [])
                        setSelectorTotal(data.totalCount || 0)
                        setSelectorLoading(false)
                    },
                    selectorPage.current,
                    pageSize,
                    filtersInfoForManual.current,
                    0,
                    query
                )
            } else {
                await getProductsByIds(
                    selectedProductIds,
                    (data: any) => {
                        setSelectedProducts(data.products || [])
                        setSelectorTotal(data.totalCount || 0)
                        setSelectorLoading(false)
                    },
                )
            }
        } catch (error) {
            console.error('Error loading products:', error)
            setSelectorLoading(false)
        }
    }, [selectorSearch, showModal, type])

    const handlePageChange = useCallback((page: number) => {
        setSelectorCurrentPage(page)
        selectorPage.current = page
        loadSelectorProducts()
    }, [loadSelectorProducts])

    // Загрузка выбранных товаров для режима просмотра
    const loadSelectedViewProducts = useCallback(async () => {
        if (selectedProductIds.length === 0) {
            setSelectedViewProducts([])
            return
        }

        setSelectedViewLoading(true)
        try {
            if (selectorViewMode === "all") {
                await getAdminProducts(
                    (data: any) => {
                        const filtered = (data.products || []).filter((p: any) =>
                            selectedProductIds.includes(p.id)
                        )
                        setSelectedViewProducts(filtered)
                        setSelectedViewLoading(false)
                    },
                    1,
                    selectedProductIds.length,
                    filtersInfo.current,
                    0,
                    ''
                )
            } else {
                await getProductsByIds(
                    selectedProductIds,
                    (data: any) => {
                        setSelectedProducts(data.products || [])
                        setSelectorLoading(false)
                        setSelectedViewLoading(false)
                        setLoading(false)
                    },
                )
            }
        } catch (error) {
            console.error('Error loading selected products:', error)
            setSelectedViewLoading(false)
        }
    }, [selectedProductIds, selectorViewMode])

    // Загружаем при открытии модалки
    useEffect(() => {
        if (type === 'dynamic' || type === 'hybrid') {
            loadFilters()
            updatePreview()
        }
        if (type === 'manual' || type === 'hybrid') {
            selectorPage.current = 1
            loadSelectorProducts()
        }
    }, [])

    // Загружаем выбранные товары при переключении в режим просмотра
    useEffect(() => {
        if (selectorViewMode === 'selected' && selectedProductIds.length > 0) {
            loadSelectedViewProducts()
        }
    }, [selectorViewMode, selectedProductIds, loadSelectedViewProducts])

    const handleSelectorSearch = (query: string) => {
        setSelectorSearch(query)
        selectorPage.current = 1
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = setTimeout(() => {
            loadSelectorProducts(query)
        }, 300)
    }

    // Добавление товара в коллекцию
    const handleAddProducts = (ids: number[]) => {
        const newIds = ids.filter(id => !selectedProductIds.includes(id))
        if (newIds.length === 0) return

        const productsToAdd = selectorProducts
            .filter(p => newIds.includes(p.id))
            .map((p: any) => ({
                id: p.id,
                name: p.name || 'Без названия',
                article: p.article || '',
                price: p.price || 0,
                old_price: p.old_price,
                firm: p.firm || '—',
                image_path: p.image_path,
                status: p.status || 'draft'
            }))

        setSelectedProducts(prev => [...prev, ...productsToAdd])
        setSelectedProductIds(prev => [...prev, ...newIds])

        if (selectorViewMode === 'selected') {
            loadSelectedViewProducts()
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
        setType(COLLECTION_TYPES.DYNAMIC)
        setIsActive(true)
        // NEW: default display_type = DETAILED (full)
        setDisplayType(DISPLAY_TYPES.DETAILED)
        setCoverImageUrl('')
        setCoverImageFile(null)
        setCoverImagePreview('')

        setSelectedProductIds([])
        setSelectedProducts([])
        setSelectedPage(1)
        setSelectorViewMode('all')
        setSelectedViewProducts([])
        filtersInfo.current = {
            sizes: [],
            firms: [],
            types: [],
            price: [0, 100000],
            rule_ids: [],
            in_store: false,
            lines: [],
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

    const openModal = async (collection?: Collection) => {
        if (collection) {
            try {
                setShowModal(true)
                setLoadingCollection(true)

                const fullCollection = await getCollection(collection.id)
                const col = fullCollection.collection

                setEditingCollection(fullCollection)
                setSlug(col.slug)
                setName(col.name)
                setDescription(col.description || '')
                setType(col.type as any)
                setIsActive(col.is_active)

                // NEW: display_type и cover
                setDisplayType(((col as any).display_type as DisplayType) ?? DISPLAY_TYPES.DETAILED)
                setCoverImageUrl((col as any).cover_image_url ?? '')
                setCoverImageFile(null)
                setCoverImagePreview((col as any).cover_image_url ?? '')

                if (fullCollection.filters) {
                    const f = fullCollection.filters
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
                }

                if (col.type === 'manual' || col.type === 'hybrid') {
                    setSelectedProductIds(fullCollection.product_ids)
                }

                if (col.type === 'dynamic' || col.type === 'hybrid') {
                    setFiltersVersion(prev => prev + 1)
                    await updatePreview()
                }

                if (col.type === 'manual' || col.type === 'hybrid') {
                    selectorPage.current = 1
                    await loadSelectorProducts()
                }

                setLoadingCollection(false)
            } catch (error) {
                console.error('Error loading collection:', error)
                alert('Ошибка при загрузке коллекции')
                setShowModal(false)
                setLoadingCollection(false)
            }
        } else {
            resetForm()
            setShowModal(true)
            loadFilters()
            updatePreview()
        }
    }

    // NEW: обработчики обложки
    const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverImageFile(file)
            setCoverImagePreview(URL.createObjectURL(file))
        }
        e.target.value = ''
    }

    const handleCoverClear = () => {
        setCoverImageFile(null)
        setCoverImagePreview('')
        setCoverImageUrl('') // при сохранении уйдёт null
        if (coverFileInputRef.current) coverFileInputRef.current.value = ''
    }

    const handleSave = async () => {
        if (!validateForm()) return

        setCoverUploading(true)
        let finalCoverUrl: string | null = coverImageUrl || null

        try {
            // NEW: если выбран новый файл — грузим, получаем URL
            if (coverImageFile) {
                finalCoverUrl = await uploadCollectionCover(coverImageFile)
            } else if (!coverImagePreview) {
                // превью пустое и файла нет — пользователь удалил обложку
                finalCoverUrl = null
            }

            const data = {
                slug,
                name,
                description,
                type,
                is_active: isActive,
                // NEW
                display_type: displayType,
                cover_image_url: finalCoverUrl,
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
                },
                product_ids: type !== 'dynamic' ? selectedProductIds : undefined
            }

            if (editingCollection?.collection.id) {
                await updateCollection(editingCollection.collection.id, data)
            } else {
                await createCollection(data)
            }
            await loadCollections()
            setShowModal(false)
            resetForm()
        } catch (error) {
            console.error('Save error:', error)
            alert('Ошибка при сохранении')
        } finally {
            setCoverUploading(false)
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

    // Определяем какие товары показывать в ProductSelector
    const displayProducts = useMemo(() => {
        if (selectorViewMode === 'selected') {
            return selectedProducts
        }
        return selectorProducts
    }, [selectorViewMode, selectedProducts, selectorProducts])

    const displayLoading = useMemo(() => {
        if (selectorViewMode === 'selected') {
            return selectedViewLoading
        }
        return selectorLoading
    }, [selectorViewMode, selectedViewLoading, selectorLoading])

    const displayTotal = useMemo(() => {
        if (selectorViewMode === 'selected') {
            return selectedProductIds.length
        }
        return selectorTotal
    }, [selectorViewMode, selectedProductIds, selectorTotal])

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление коллекциями</h2>
                <Button className={s.btn + " " + s.btn_ghost} text="+ Создать коллекцию" onClick={() => openModal()} />
            </div>

            {loading ? (
                <div className={s.loader}>Загрузка...</div>
            ) : collections.length === 0 ? (
                <div className={s.emptyState}>Нет коллекций. Создайте первую коллекцию!</div>
            ) : (
                <div className={s.collectionsGrid}>
                    {collections.map((col) => (
                        <div key={col.id} className={`${s.collectionCard} ${!col.is_active ? s.inactive : ''}`}>
                            {/* NEW: превью обложки */}
                            {(col as any).cover_image_url && (
                                <div className={s.coverPreview}>
                                    <img
                                        src={(col as any).cover_image_url}
                                        alt={col.name}
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                                    />
                                </div>
                            )}
                            <div className={s.collectionInfo}>
                                <h3>{col.name}</h3>
                                <div className={s.collectionMeta}>
                                    <span>Slug: {col.slug}</span>
                                    <span className={`${s.typeBadge} ${s[col.type]}`}>
                                        {col.type === 'dynamic' ? 'Динамическая' :
                                            col.type === 'manual' ? 'Ручная' : 'Гибридная'}
                                    </span>
                                    {/* NEW: бейдж display_type */}
                                    <span className={`${s.typeBadge} ${(col as any).display_type === DISPLAY_TYPES.SHORT ? s.short : s.detailed}`}>
                                        {(col as any).display_type === DISPLAY_TYPES.SHORT ? 'Краткий вид' : 'Подробный вид'}
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
                {loadingCollection ? (
                    <div className={s.loader}>
                        <div className={s.spinner}></div>
                        <p>Загрузка коллекции...</p>
                    </div>
                ) : (
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
                            <Combobox
                                currentIndex={type}
                                enumProp={true}
                                data={{
                                    "dynamic": "Динамическая (по фильтрам)",
                                    "manual": "Ручная (выбор товаров)",
                                    "hybrid": "Гибридная (фильтры + ручной выбор)"
                                }}
                                onChangeIndex={(val) => setType(val as CollectionType)}
                                className={s.combobox}
                            />
                        </div>

                        {/* NEW: тип отображения */}
                        <div className={s.formGroup}>
                            <label>Тип отображения</label>
                            <Combobox
                                currentIndex={displayType}
                                enumProp={true}
                                data={DISPLAY_TYPE_OPTIONS}
                                onChangeIndex={(val) => setDisplayType(Number(val) as DisplayType)}
                                className={s.combobox}
                            />
                            <div className={s.fieldHint}>
                                «Подробный» тянет описание и год/дату релиза товаров — используйте, если карточка должна их показывать.
                            </div>
                        </div>

                        {/* NEW: обложка коллекции */}
                        <div className={s.formGroup}>
                            <label>Обложка коллекции</label>
                            <div className={s.imageUpload}>
                                {coverImagePreview ? (
                                    <div className={s.imagePreview}>
                                        <img src={coverImagePreview} alt="cover" />
                                        <button
                                            type="button"
                                            className={s.deleteImageBtn}
                                            onClick={handleCoverClear}
                                        >
                                            <img src={deleteIconUrl} alt="delete" style={{ width: '18px', height: '18px' }} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <input
                                            ref={coverFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverSelect}
                                            id="coverUpload"
                                            style={{
                                                position: 'absolute',
                                                opacity: 0,
                                                width: '100%',
                                                height: '100%',
                                                cursor: 'pointer',
                                                zIndex: 10,
                                                top: 0,
                                                left: 0,
                                            }}
                                        />
                                        <label
                                            htmlFor="coverUpload"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '30px',
                                                background: '#f5f5f5',
                                                border: '2px dashed #ccc',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                minHeight: '120px',
                                                color: '#666',
                                            }}
                                        >
                                            Выбрать обложку
                                        </label>
                                    </div>
                                )}
                                {coverUploading && <div className={s.uploading}>Загрузка...</div>}
                            </div>
                        </div>

                        {type !== 'manual' && (
                            <div className={s.formGroup}>
                                <label>Фильтры</label>
                                <div
                                    className={`${s.filtersPreview} ${errors.filters ? s.errorBorder : ''}`}
                                    onClick={() => setShowFiltersPanel(true)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={s.filtersSummary}>
                                        {getFiltersSummary}
                                    </div>
                                    <span className={s.editHint}>✏️ нажмите чтобы настроить</span>
                                </div>
                                {errors.filters && <div className={s.errorText}>Выберите хотя бы один фильтр</div>}

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
                                <label>Товары {type === 'manual' && '*'}</label>

                                <ProductSelector
                                    products={displayProducts}
                                    selectedIds={selectedProductIds}
                                    onChange={handleAddProducts}
                                    isLoading={displayLoading}
                                    total={displayTotal}
                                    searchQuery={selectorSearch}
                                    currentPage={selectorCurrentPage}
                                    onSearch={handleSelectorSearch}
                                    onPageChange={handlePageChange}
                                    onViewSelected={setSelectorViewMode}
                                    multiple={true}
                                    maxItems={500}
                                    placeholder="Поиск товаров для добавления..."
                                    showViewSelected={true}
                                    pageSize={pageSize}
                                />
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
                            <Button
                                text={coverUploading ? 'Сохранение...' : 'Сохранить'}
                                onClick={handleSave}
                                disabled={coverUploading}
                            />
                        </div>
                    </div>
                )}

                {showFiltersPanel && (
                    <div className={s.modalOverlay} onClick={(e) => { e.stopPropagation(); setShowFiltersPanel(false) }}>
                        <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
                            <div className={s.modalHeader}>
                                <h3>Выберите условия показа</h3>
                                <button onClick={() => setShowFiltersPanel(false)}>✕</button>
                            </div>
                            <Scroller onlyVertical={true}>
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