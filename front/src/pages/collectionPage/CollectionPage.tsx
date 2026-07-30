// pages/collections/[collection].tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import { finishLoading } from 'src/store/reducers/loadingSlice'
import { CheckBoxType } from 'src/types/modules'
import { BODY_TYPES } from 'src/constants/bodytypes'
import { getCollectionBySlug, getCollectionProducts } from 'src/providers/collectionsProvider'
import MerchSliderField from 'src/modules/merchField/MerchFieldWithPageSwitcher'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import Combobox from 'src/components/combobox/Combobox'
import RadioGroup from 'src/components/radio/RadioGroup'
import { ReactComponent as Filter } from '/public/filter.svg'
import { ReactComponent as Sort } from '/public/sort.svg'
import s from "./style.module.css"

interface FiltersInfoRequest {
    sizes: string[]
    price: number[]
    firms: number[]
    types: number[]
    bodytypes: string[]
    lines: number[]
    store: boolean
    withPrice: boolean
    discount: boolean
    rule_ids: number[]
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

const PAGE_SIZE = 24

const CollectionPage: React.FC = () => {
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { collection } = router.query // ← collection, не slug!
    
    const { typesVal, categories, discountRules, firmMap, lineMap } = useAppSelector(state => state.menuReducer)
    const { widthProps } = useAppSelector(state => state.resizeReducer)

    // Рефы
    const filtersInfo = useRef<FiltersInfoRequest>({
        sizes: [],
        price: [],
        firms: [],
        types: [],
        bodytypes: [],
        lines: [],
        store: false,
        withPrice: true,
        discount: false,
        rule_ids: []
    })
    
    const collectionBaseFilters = useRef<any>(null)
    const searchWord = useRef("")
    const currentPage = useRef(1)
    const pages = useRef(1)
    const orderType = useRef(0)
    const emptyData = useRef(false)
    const emtyText = useRef("В этой коллекции пока нет товаров")
    const isInitialLoad = useRef(true)
    
    // Состояния
    const [merchFieldData, setMerchFieldData] = useState<any[]>([])
    const [filtersState, setFiltersState] = useState<FiltersState>({
        priceProps: { min: 0, max: 0 },
        checboxsProps: [],
        soloDataProps: []
    })
    const [grid, setGrid] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showSortPanel, setShowSortPanel] = useState(false)
    const [showFiltersPanel, setShowFiltersPanel] = useState(false)
    const [collectionName, setCollectionName] = useState('')
    const [totalCount, setTotalCount] = useState(0)
    
    const pageWrap = useRef<HTMLDivElement>(null)

    // Конвертация фильтров из ответа
    const convertFiltersData = useCallback((resData: any) => {
        if (!resData) return
        
        const priceProps = {
            min: resData.min_price || 0,
            max: resData.max_price || 100000,
            dataLeft: filtersInfo.current.price[0] || resData.min_price || 0,
            dataRight: filtersInfo.current.price[1] || resData.max_price || 100000
        }

        // Размеры
        const checkBoxPropsData: CheckBoxType[] = []
        if (resData.sizes) {
            Object.entries(resData.sizes).forEach(([size, count]) => {
                const active = filtersInfo.current.sizes.includes(size)
                checkBoxPropsData.push({
                    id: size,
                    enable: true,
                    activeData: active,
                    name: size
                })
            })
        }

        // Типы товара
        const checkBoxPropsTypeData: CheckBoxType[] = []
        if (resData.product_types) {
            resData.product_types.forEach((typeId: number) => {
                const typeDescr = typesVal[typeId]
                if (!typeDescr) return
                const active = filtersInfo.current.types.includes(typeId)
                checkBoxPropsTypeData.push({
                    id: typeId,
                    enable: true,
                    activeData: active,
                    name: typeDescr.name
                })
            })
        }

        // Фирмы
        const checkBoxPropsFirmData: CheckBoxType[] = []
        if (resData.firms) {
            Object.entries(resData.firms).forEach(([firmName, count]) => {
                const firm = Object.values(firmMap).find(f => f.name === firmName)
                if (!firm) return
                const active = filtersInfo.current.firms.includes(firm.id)
                checkBoxPropsFirmData.push({
                    id: firm.slug,
                    enable: true,
                    activeData: active,
                    name: firmName
                })
            })
        }

        // Bodytypes
        const checkBoxPropsBodyData: CheckBoxType[] = []
        if (resData.bodytypes) {
            Object.entries(resData.bodytypes).forEach(([body, count]) => {
                const active = filtersInfo.current.bodytypes.includes(body)
                checkBoxPropsBodyData.push({
                    id: body,
                    enable: true,
                    activeData: active,
                    name: BODY_TYPES[body] || body
                })
            })
        }

        // Скидки
        const checkBoxPropsDiscountData: CheckBoxType[] = []
        if (resData.discount_rules) {
            resData.discount_rules.forEach((rule: any) => {
                const active = filtersInfo.current.rule_ids.includes(rule.id)
                checkBoxPropsDiscountData.push({
                    id: rule.id,
                    enable: true,
                    activeData: active,
                    name: rule.name
                })
            })
        }

        // Линии
        const checkBoxPropsLineData: CheckBoxType[] = []
        if (resData.lines) {
            Object.entries(resData.lines).forEach(([lineName, count]) => {
                const line = Object.values(lineMap).find(l => l.name === lineName)
                if (!line) return
                const active = filtersInfo.current.lines.includes(line.id)
                checkBoxPropsLineData.push({
                    id: line.slug,
                    enable: true,
                    activeData: active,
                    name: lineName
                })
            })
        }

        // Solo чекбоксы
        const soloDataProps: CheckBoxType[] = [
            {
                id: 'withPrice',
                enable: true,
                activeData: filtersInfo.current.withPrice ?? true,
                name: "Есть на складе"
            },
            {
                id: 'store',
                enable: true,
                activeData: filtersInfo.current.store ?? false,
                name: "В наличии"
            }
        ]

        const checboxsProps = [
            { id: "sizes", name: "Размеры", props: checkBoxPropsData },
            { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
            { id: "bodytypes", name: "Телосложение", props: checkBoxPropsBodyData },
            { id: "type", name: "Типы товара", props: checkBoxPropsTypeData },
            { id: "discounts", name: "Скидки", props: checkBoxPropsDiscountData }
        ]

        if (checkBoxPropsLineData.length > 0) {
            checboxsProps.push({ id: "lines", name: "Линейки", props: checkBoxPropsLineData })
        }

        setFiltersState({
            priceProps,
            checboxsProps,
            soloDataProps
        })
    }, [typesVal, firmMap, lineMap])

    // Загрузка базовых данных коллекции
    const loadCollection = useCallback(async () => {
        if (!collection || !router.isReady) return
        
        setLoading(true)
        try {
            const data = await getCollectionBySlug(collection as string) // ← collection
            
            if (data.collection) {
                setCollectionName(data.collection.name)
            }
            
            if (data.filters) {
                collectionBaseFilters.current = data.filters
                convertFiltersData(data.filters)
            }
            
            if (data.products) {
                setMerchFieldData(data.products)
                setTotalCount(data.total || 0)
                pages.current = Math.ceil((data.total || 0) / PAGE_SIZE)
                currentPage.current = data.page || 1
            }
            
            if (!data.products || data.products.length === 0) {
                emptyData.current = true
                emtyText.current = "В этой коллекции пока нет товаров"
            } else {
                emptyData.current = false
            }
        } catch (error) {
            console.error('Error loading collection:', error)
            emptyData.current = true
            emtyText.current = "Ошибка загрузки коллекции"
        } finally {
            setLoading(false)
            dispatch(finishLoading())
        }
    }, [collection, router.isReady, convertFiltersData, dispatch])

    // Загрузка товаров с фильтрацией
    const loadCollectionProducts = useCallback(async (page: number) => {
        if (!collection || !router.isReady) return
        
        setLoading(true)
        try {
            const params = {
                page: page,
                size: PAGE_SIZE,
                sortType: orderType.current,
                search: searchWord.current,
                filters: {
                    sizes: filtersInfo.current.sizes,
                    firms: filtersInfo.current.firms,
                    types: filtersInfo.current.types,
                    bodytypes: filtersInfo.current.bodytypes,
                    lines: filtersInfo.current.lines,
                    price_min: filtersInfo.current.price[0] || 0,
                    price_max: filtersInfo.current.price[1] || 100000,
                    in_store: filtersInfo.current.store,
                    with_price: filtersInfo.current.withPrice,
                    rule_ids: filtersInfo.current.rule_ids
                }
            }

            const data = await getCollectionProducts(collection as string, params) // ← collection
            
            if (!data.products || data.products.length === 0) {
                emptyData.current = true
                emtyText.current = page === 1 
                    ? "По выбранным фильтрам товаров не найдено" 
                    : "Больше товаров нет"
            } else {
                emptyData.current = false
                setMerchFieldData(data.products)
                setTotalCount(data.total || 0)
                pages.current = Math.ceil((data.total || 0) / PAGE_SIZE)
                currentPage.current = page
            }
        } catch (error) {
            console.error('Error loading products:', error)
            emptyData.current = true
            emtyText.current = "Ошибка загрузки товаров"
        } finally {
            setLoading(false)
            dispatch(finishLoading())
        }
    }, [collection, router.isReady, dispatch])

    // Инициализация - ждем router.isReady
    useEffect(() => {
        if (!router.isReady) return
        
        if (collection && Object.keys(typesVal).length > 0) {
            isInitialLoad.current = true
            loadCollection()
        }
    }, [router.isReady, collection, typesVal])

    // Обновление при изменении фильтров/сортировки/поиска
    useEffect(() => {
        if (!router.isReady || !collection || !collectionBaseFilters.current || isInitialLoad.current) {
            if (isInitialLoad.current) {
                isInitialLoad.current = false
            }
            return
        }
        loadCollectionProducts(1)
    }, [
        filtersInfo.current.sizes,
        filtersInfo.current.firms,
        filtersInfo.current.types,
        filtersInfo.current.bodytypes,
        filtersInfo.current.lines,
        filtersInfo.current.price,
        filtersInfo.current.store,
        filtersInfo.current.withPrice,
        filtersInfo.current.rule_ids,
        orderType.current,
        searchWord.current,
        collection,
        router.isReady,
        loadCollectionProducts
    ])

    // Обработчик изменения фильтров
    const onFiltersChange = useCallback((filter: any) => {
        switch (filter.id) {
            case "sizes":
                filtersInfo.current.sizes = filter.data || []
                break
            case "firms":
                filtersInfo.current.firms = (filter.data || [])
                    .map((slug: string) => firmMap[slug]?.id)
                    .filter(Boolean)
                break
            case "lines":
                filtersInfo.current.lines = (filter.data || [])
                    .map((slug: string) => lineMap[slug]?.id)
                    .filter(Boolean)
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
                if (filter.data && filter.data.length >= 2) {
                    const withPriceItem = filter.data.find((item: CheckBoxType) => item.id === 'withPrice')
                    const storeItem = filter.data.find((item: CheckBoxType) => item.id === 'store')
                    filtersInfo.current.withPrice = withPriceItem ? withPriceItem.activeData : true
                    filtersInfo.current.store = storeItem ? storeItem.activeData : false
                }
                break
            default:
                break
        }
        // Обновляем состояние фильтров для отображения
        setFiltersState(prevState => {
            const newState = { ...prevState }
            newState.checboxsProps = newState.checboxsProps.map(section => {
                const newSection = { ...section }
                switch (section.id) {
                    case "sizes":
                        newSection.props = section.props.map(item => ({
                            ...item,
                            activeData: filtersInfo.current.sizes.includes(String(item.id))
                        }))
                        break
                    case "firms":
                        newSection.props = section.props.map(item => {
                            const firm = Object.values(firmMap).find(f => f.slug === item.id)
                            return {
                                ...item,
                                activeData: firm ? filtersInfo.current.firms.includes(firm.id) : false
                            }
                        })
                        break
                    case "lines":
                        newSection.props = section.props.map(item => {
                            const line = Object.values(lineMap).find(l => l.slug === item.id)
                            return {
                                ...item,
                                activeData: line ? filtersInfo.current.lines.includes(line.id) : false
                            }
                        })
                        break
                    case "type":
                        newSection.props = section.props.map(item => ({
                            ...item,
                            activeData: filtersInfo.current.types.includes(Number(item.id))
                        }))
                        break
                    case "discounts":
                        newSection.props = section.props.map(item => ({
                            ...item,
                            activeData: filtersInfo.current.rule_ids.includes(Number(item.id))
                        }))
                        break
                    case "bodytypes":
                        newSection.props = section.props.map(item => ({
                            ...item,
                            activeData: filtersInfo.current.bodytypes.includes(String(item.id))
                        }))
                        break
                    default:
                        break
                }
                return newSection
            })
            newState.soloDataProps = newState.soloDataProps.map(item => ({
                ...item,
                activeData: item.id === 'withPrice' 
                    ? (filtersInfo.current.withPrice ?? true) 
                    : (filtersInfo.current.store ?? false)
            }))
            return newState
        })
    }, [firmMap, lineMap])

    // Сортировка
    const orderTypeChange = useCallback((ind: number | string) => {
        orderType.current = Number(ind)
    }, [])

    // Пагинация
    const pageChange = useCallback((page: number) => {
        currentPage.current = page
        loadCollectionProducts(page)
    }, [loadCollectionProducts])

    // Поиск по названию
    const searchNameCallback = useCallback((name: string) => {
        searchWord.current = name
    }, [])

    // Сброс фильтров
    const resetFilters = useCallback(() => {
        filtersInfo.current = {
            sizes: [],
            price: [],
            firms: [],
            types: [],
            bodytypes: [],
            lines: [],
            store: false,
            withPrice: true,
            discount: false,
            rule_ids: []
        }
        currentPage.current = 1
        if (collectionBaseFilters.current) {
            convertFiltersData(collectionBaseFilters.current)
        }
        loadCollectionProducts(1)
    }, [loadCollectionProducts, convertFiltersData])

    // Адаптив
    useEffect(() => {
        if (!pageWrap.current) return
        const handleResize = () => {
            const width = pageWrap.current?.clientWidth || 0
            setGrid(width < 800)
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Блокировка скролла
    useEffect(() => {
        if (showSortPanel || showFiltersPanel) {
            document.body.classList.add('modalOpen')
        } else {
            document.body.classList.remove('modalOpen')
        }
        return () => document.body.classList.remove('modalOpen')
    }, [showSortPanel, showFiltersPanel])

    // Если роутер еще не готов - показываем загрузку
    if (!router.isReady) {
        return <div className={s.loader}>Загрузка...</div>
    }

    // Если нет collection - 404
    if (!collection) {
        return <div className={s.emptyRow}>Коллекция не найдена</div>
    }

    return (
        <div ref={pageWrap}>
            <div style={{ position: "relative" }}>
                <div className={s.head}>
                    {collectionName ? `Коллекция: ${collectionName}` : 'Коллекция'}
                    {totalCount > 0 && <span className={s.count}> ({totalCount} товаров)</span>}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    marginBottom: "20px",
                    gap: "10px"
                }}>
                    <div style={{ margin: "auto", width: "30%", padding: "5px" }}>
                        {widthProps ? (
                            <Sort
                                type="button"
                                onClick={() => setShowSortPanel(true)}
                                className={s.settingsBtn}
                            />
                        ) : (
                            <Combobox
                                enumProp={true}
                                onChangeIndex={orderTypeChange}
                                data={[
                                    "Без сортировки",
                                    "По имени вверх",
                                    "По имени вниз",
                                    "По возрастанию цены",
                                    "По убыванию цены"
                                ]}
                            />
                        )}
                    </div>

                    <SearchWithList
                        val={searchWord.current}
                        searchCallback={searchNameCallback}
                        selectList={(data) => router.push('/product/' + data)}
                    />

                    {widthProps ? (
                        <div style={{ margin: "auto", width: "30%", padding: "5px" }}>
                            <Filter
                                className={s.filterBtn}
                                onClick={() => setShowFiltersPanel(true)}
                            />
                        </div>
                    ) : (
                        <div style={{ margin: "auto", width: "30%" }} />
                    )}
                </div>

                {emptyData.current ? (
                    <div className={s.emptyRow}>
                        {emtyText.current}
                        <span onClick={resetFilters}> Сбросить фильтры</span>
                    </div>
                ) : (
                    <div style={{ position: "relative", display: "flex", alignItems: "flex-start" }}>
                        <MerchSliderField
                            onChange={pageChange}
                            currentPage={currentPage.current}
                            pages={pages.current}
                            heightRow={300}
                            size={grid ? 2 : 3}
                            data={merchFieldData}
                        />
                        {!widthProps && (
                            <div style={{ width: "25%" }}>
                                <ProductsFilters
                                    classNames={{ secondPage: s.secondPage }}
                                    onChange={onFiltersChange}
                                    {...filtersState}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Модалка сортировки */}
            {showSortPanel && (
                <div className={s.modalOverlay} onClick={() => setShowSortPanel(false)}>
                    <div className={s.modalPanelLeft} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Сортировка</h3>
                            <button onClick={() => setShowSortPanel(false)}>✕</button>
                        </div>
                        <RadioGroup
                            onChange={(ind) => {
                                orderTypeChange(ind)
                                setShowSortPanel(false)
                            }}
                            checked={orderType.current}
                            name={"ordered"}
                            lampArray={[
                                "Без сортировки",
                                "По имени вверх",
                                "По имени вниз",
                                "По возрастанию цены",
                                "По убыванию цены"
                            ]}
                        />
                    </div>
                </div>
            )}

            {/* Модалка фильтров */}
            {showFiltersPanel && (
                <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
                    <div className={s.modalPanelRight} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Фильтры</h3>
                            <button onClick={() => setShowFiltersPanel(false)}>✕</button>
                        </div>
                        <ProductsFilters
                            classNames={{ secondPage: s.secondPage }}
                            onChange={onFiltersChange}
                            {...filtersState}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default React.memo(CollectionPage)