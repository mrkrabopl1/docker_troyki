// modules/admin/collectionForm/CollectionForm.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Button from 'src/components/Button'
import ProductsFilters from 'src/modules/settingsPanels/ProductsFilters'
import ProductSelector from 'src/modules/merchField/ProductSelector'
import { useAppSelector } from 'src/store/hooks/redux'
import { CheckBoxType, Collection } from 'src/types/modules'
import { BODY_TYPES } from 'src/constants/bodytypes'
import Scroller from 'src/components/scroller/Scroller'
import Modal from 'src/components/modal/Modal'
import Combobox from 'src/components/combobox/Combobox'
import { getAdminProductsAndFilters, getAdminProducts } from 'src/providers/adminProductsProvider'
import s from './style.module.css'
import { COLLECTION_TYPES, CollectionType } from 'src/types/adminProduct';

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
    id: string
    name: string
    options: VariationOption[]
}

interface VariationOption {
    id: string
    name: string
    props: CheckBoxType[]
}

interface CollectionFormProps {
    initialData?: Collection | null
    onSave: (data: any) => void
    onCancel: () => void
    onClose: () => void
}

const CollectionForm: React.FC<CollectionFormProps> = ({
    initialData,
    onSave,
    onCancel,
    onClose
}) => {
    const { typesVal, firmMap, lineMap } = useAppSelector(state => state.menu)
    const [filtersVersion, setFiltersVersion] = useState(0)

    // Форма
    const [slug, setSlug] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<CollectionType>(COLLECTION_TYPES.DYNAMIC);
    const [isActive, setIsActive] = useState(true)
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
    const [showFiltersPanel, setShowFiltersPanel] = useState(false)

    // Фильтры
    const filtersInfo = useRef<{
        sizes: string[]
        firms: number[]
        types: number[]
        price: [number, number]
        rule_ids: number[]
        in_store: boolean,
        bodytypes: string[],
        lines: number[],
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

    const [errors, setErrors] = useState<{ filters?: boolean }>({})

    // Состояния для загрузки
    const [previewProducts, setPreviewProducts] = useState<any[]>([])
    const [previewTotal, setPreviewTotal] = useState(0)
    const [previewLoading, setPreviewLoading] = useState(false)

    // Состояния для ProductSelector
    const [selectorProducts, setSelectorProducts] = useState<any[]>([])
    const [selectorLoading, setSelectorLoading] = useState(false)
    const [selectorTotal, setSelectorTotal] = useState(0)
    const [selectorSearch, setSelectorSearch] = useState('')
    const [selectorCurrentPage, setSelectorCurrentPage] = useState(1)
    const [selectorViewMode, setSelectorViewMode] = useState<'all' | 'selected'>('all')
    const [selectedViewProducts, setSelectedViewProducts] = useState<any[]>([])
    const [selectedViewLoading, setSelectedViewLoading] = useState(false)
    const selectorPage = useRef(1)
    const pageSize = 20
    const searchTimeoutRef = useRef<any>()

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
            const active = filtersInfo.current.lines.includes(line.id);
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
            case "variation_catalog_filter":
                const { selectedOptionId } = filter.data;
                if (selectedOptionId === 'lines_option') {
                    filtersInfo.current.firms = [];
                } else if (selectedOptionId === 'firms_option') {
                    filtersInfo.current.lines = [];
                }
                break
            case "variation_checkbox_catalog_filter":
                const { optionId, selectedCheckboxes } = filter.data;
                if (optionId === 'lines_option') {
                    filtersInfo.current.lines = selectedCheckboxes || [];
                } else if (optionId === 'firms_option') {
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
    }, [firmMap, updatePreview])

    // Загрузка товаров для селектора
    const loadSelectorProducts = useCallback(async (searchQuery?: string) => {
        if (type === 'dynamic') return

        setSelectorLoading(true)
        try {
            const query = searchQuery !== undefined ? searchQuery : selectorSearch
            
            await getAdminProducts(
                (data: any) => {
                    setSelectorProducts(data.products || [])
                    setSelectorTotal(data.totalCount || 0)
                    setSelectorLoading(false)
                },
                selectorPage.current,
                pageSize,
                {},
                0,
                query
            )
        } catch (error) {
            console.error('Error loading products:', error)
            setSelectorLoading(false)
        }
    }, [selectorSearch, type])

    // Загрузка выбранных товаров для режима просмотра
    const loadSelectedViewProducts = useCallback(async () => {
        if (selectedProductIds.length === 0) {
            setSelectedViewProducts([])
            return
        }

        setSelectedViewLoading(true)
        try {
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
                { product_ids: selectedProductIds },
                0,
                ''
            )
        } catch (error) {
            console.error('Error loading selected products:', error)
            setSelectedViewLoading(false)
        }
    }, [selectedProductIds])

    const handleSelectorSearch = (query: string) => {
        setSelectorSearch(query)
        selectorPage.current = 1
        setSelectorCurrentPage(1)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = setTimeout(() => {
            loadSelectorProducts(query)
        }, 300)
    }

    const handlePageChange = (page: number) => {
        setSelectorCurrentPage(page)
        selectorPage.current = page
        loadSelectorProducts()
    }

    // Обработчик просмотра выбранных товаров
    const handleViewSelected = useCallback(() => {
        setSelectorViewMode('selected')
        if (selectedProductIds.length > 0) {
            loadSelectedViewProducts()
        }
    }, [selectedProductIds, loadSelectedViewProducts])

    // Инициализация данных
    useEffect(() => {
        if (initialData) {
            setSlug(initialData.slug)
            setName(initialData.name)
            setDescription(initialData.description || '')
            setType(initialData.type as any)
            setIsActive(initialData.is_active)

            if (initialData.settings?.filters) {
                const f = initialData.settings.filters
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

            if (initialData.type === 'manual' || initialData.type === 'hybrid') {
                setSelectedProductIds(initialData.product_ids || [])
            }
        }

        loadFilters()
        if (type !== 'dynamic') {
            loadSelectorProducts()
        }
    }, [initialData, type])

    // Загружаем выбранные товары при переключении в режим просмотра
    useEffect(() => {
        if (selectorViewMode === 'selected' && selectedProductIds.length > 0) {
            loadSelectedViewProducts()
        }
    }, [selectorViewMode, selectedProductIds, loadSelectedViewProducts])

    // Валидация
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
            case 'dynamic':
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

            case 'manual':
                if (selectedProductIds.length === 0) {
                    alert('Для ручной коллекции нужно выбрать хотя бы один товар')
                    return false
                }
                break

            case 'hybrid':
                const hasHybridFilters =
                    (filtersInfo.current.types && filtersInfo.current.types.length > 0) ||
                    (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) ||
                    (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) ||
                    (filtersInfo.current.price && filtersInfo.current.price[0] > 0) ||
                    (filtersInfo.current.rule_ids && filtersInfo.current.rule_ids.length > 0) ||
                    (filtersInfo.current.in_store === true) ||
                    (filtersInfo.current.bodytypes && filtersInfo.current.bodytypes.length > 0)

                if (!hasHybridFilters && selectedProductIds.length === 0) {
                    alert('Для гибридной коллекции нужно выбрать хотя бы один фильтр ИЛИ хотя бы один товар')
                    return false
                }
                break
        }

        return true
    }

    // Сохранение
    const handleSave = () => {
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
            },
            product_ids: type !== 'dynamic' ? selectedProductIds : undefined
        }

        onSave(data)
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
    }, [filtersVersion, typesVal, firmMap])

    // Определяем какие товары показывать в ProductSelector
    const displayProducts = useMemo(() => {
        if (selectorViewMode === 'selected') {
            return selectedViewProducts
        }
        return selectorProducts
    }, [selectorViewMode, selectedViewProducts, selectorProducts])

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
        <div className={s.formContainer}>
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
                    <label>Товары</label>
                    <ProductSelector
                        products={displayProducts}
                        selectedIds={selectedProductIds}
                        onChange={setSelectedProductIds}
                        isLoading={displayLoading}
                        total={displayTotal}
                        searchQuery={selectorSearch}
                        currentPage={selectorCurrentPage}
                        onSearch={handleSelectorSearch}
                        onPageChange={handlePageChange}
                        onViewSelected={handleViewSelected}
                        multiple={true}
                        maxItems={500}
                        placeholder="Поиск товаров для добавления..."
                        showViewSelected={true}
                        pageSize={pageSize}
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
                <Button text="Отмена" onClick={onCancel} />
                <Button text="Сохранить" onClick={handleSave} />
            </div>

            <Modal active={showFiltersPanel} onChange={setShowFiltersPanel}>
                <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
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
            </Modal>
        </div>
    )
}

export default CollectionForm