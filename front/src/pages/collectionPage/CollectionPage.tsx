// pages/collections/[collection].tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useAppDispatch, useAppSelector,useNavigate } from 'src/store/hooks/redux'
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

interface CollectionPageProps {
    initialData?: {
        collection: any
        products: any[]
        filters: any
        total: number
        page: number
    }
    collectionSlug?: string
}

const PAGE_SIZE = 24

const CollectionPage: React.FC<CollectionPageProps> = ({ initialData, collectionSlug }) => {
    const navigate = useNavigate()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const { collection } = router.query

    const { typesVal, categories, discountRules, firmMap, lineMap } = useAppSelector(state => state.menu)
    const { widthProps } = useAppSelector(state => state.resize)

    // 🔥 Флаг готовности firmMap
    const [isFirmMapReady, setIsFirmMapReady] = useState(false);
    useEffect(() => {
        if (Object.keys(firmMap).length > 0) {
            setIsFirmMapReady(true);
        }
    }, [firmMap]);

    // Рефы
    const filtersInfo = useRef<FiltersInfoRequest>({
        sizes: [],
        price: [],
        firms: [],
        types: [],
        bodytypes: [],
        lines: [],
        store: false,
        withPrice: false,
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
    const isHydrated = useRef(false)
    const isMounted = useRef(true)
    const settingsModuleMemo = useRef(true)
    const firmMapRef = useRef(firmMap)
    const lineMapRef = useRef(lineMap)
    const typesValRef = useRef(typesVal)

    // Состояния
    const [merchFieldData, setMerchFieldData] = useState<any[]>(initialData?.products || [])
    const [filtersState, setFiltersState] = useState<FiltersState>({
        priceProps: { min: 0, max: 0 },
        checboxsProps: [],
        soloDataProps: []
    })
    const [grid, setGrid] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showSortPanel, setShowSortPanel] = useState(false)
    const [showFiltersPanel, setShowFiltersPanel] = useState(false)
    const [collectionName, setCollectionName] = useState(initialData?.collection?.name || '')
    const collectionId = useRef<number>(0)
    const [totalCount, setTotalCount] = useState(initialData?.total || 0)
    const [refresh, setRefresh] = useState(false)

    const pageWrap = useRef<HTMLDivElement>(null)
    const rightBlockRef = useRef<HTMLDivElement>(null);

    // Sticky состояния
    const [isSticky, setIsSticky] = useState(false);
    const [stickyTop, setStickyTop] = useState(20);
    const stickyTopRef = useRef(20);

    // Обновляем refs при изменении данных
    useEffect(() => {
        firmMapRef.current = firmMap
    }, [firmMap])

    useEffect(() => {
        lineMapRef.current = lineMap
    }, [lineMap])

    useEffect(() => {
        typesValRef.current = typesVal
    }, [typesVal])

    // ============================================================
    // 🔥 КОНВЕРТАЦИЯ ФИЛЬТРОВ (аналогично SearchPage)
    // ============================================================
    const convertFiltersData = useCallback((resData: any) => {
        if (!resData) return {
            priceProps: { min: 0, max: 0 },
            checboxsProps: [],
            soloDataProps: []
        }

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
                const typeDescr = typesValRef.current[typeId]
                if (!typeDescr) return
                const active = filtersInfo.current.types.includes(typeId)
                let name = typeDescr.name
                if (typeDescr.type_key === "other") {
                    name = typeDescr.category_name + "/" + typeDescr.name
                }
                checkBoxPropsTypeData.push({
                    id: typeId,
                    enable: true,
                    activeData: active,
                    name: typeDescr.name
                })
            })
        }

        // Фирмы (используем firmMapRef)
        const checkBoxPropsFirmData: CheckBoxType[] = []
        if (resData.firms) {
            Object.entries(resData.firms).forEach(([firmName, count]) => {
                const firm = Object.values(firmMapRef.current).find(f => f.name === firmName)
                if (!firm) {
                    console.warn(`Firm "${firmName}" not found in firmMap`)
                    return
                }
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

        // Линии (используем lineMapRef)
        const checkBoxPropsLineData: CheckBoxType[] = []
        if (resData.lines) {
            Object.entries(resData.lines).forEach(([lineName, count]) => {
                const line = Object.values(lineMapRef.current).find(l => l.name === lineName)
                if (!line) {
                    console.warn(`Line "${lineName}" not found in lineMap`)
                    return
                }
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
                name: "В наличии"
            },
            {
                id: 'store',
                enable: true,
                activeData: filtersInfo.current.store ?? false,
                name: "Есть на складе"
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

        return {
            priceProps,
            checboxsProps,
            soloDataProps
        }
    }, [])

    // ============================================================
    // 🔥 ИСПОЛЬЗОВАНИЕ SSR ДАННЫХ (с проверкой firmMap)
    // ============================================================
    useEffect(() => {
        if (initialData  && isMounted.current && isFirmMapReady) {
            console.log('🔥 Using SSR data for collection')

            if (initialData.collection) {
                collectionId.current = initialData.collection.id
                setCollectionName(initialData.collection.name)
            }

            if (initialData.products) {
                if (initialData.products.length === 0) {
                    emptyData.current = true
                    emtyText.current = "В этой коллекции пока нет товаров"
                    setRefresh(prev => !prev)
                } else {
                    emptyData.current = false
                    setMerchFieldData(initialData.products)
                    setTotalCount(initialData.total || 0)
                    pages.current = Math.ceil((initialData.total || 0) / PAGE_SIZE)
                    currentPage.current = initialData.page || 1
                }
            }

            if (initialData.filters) {
                collectionBaseFilters.current = initialData.filters
                const data = convertFiltersData(initialData.filters)
                setFiltersState(data)
                settingsModuleMemo.current = !settingsModuleMemo.current
            }

            isHydrated.current = true
            dispatch(finishLoading())
        }
    }, [initialData, isFirmMapReady, convertFiltersData, dispatch])

    // ============================================================
    // ❌ КЛИЕНТСКАЯ ЗАГРУЗКА (если нет SSR)
    // ============================================================
    const loadCollection = useCallback(async () => {
        if (!collection || !router.isReady || isHydrated.current || (isMounted.current && initialData)) return
        if (!isFirmMapReady) return // Ждем загрузку firmMap

        setLoading(true)
        try {
            const data = await getCollectionBySlug(collection as string)

            if (data.collection) {
                collectionId.current = data.collection.id
                setCollectionName(data.collection.name)
            }

            if (data.filters) {
                collectionBaseFilters.current = data.filters
                const filtersData = convertFiltersData(data.filters)
                setFiltersState(filtersData)
                settingsModuleMemo.current = !settingsModuleMemo.current
            }

            if (data.products) {
                if (data.products.length === 0) {
                    emptyData.current = true
                    emtyText.current = "В этой коллекции пока нет товаров"
                    setRefresh(prev => !prev)
                } else {
                    emptyData.current = false
                    setMerchFieldData(data.products)
                    setTotalCount(data.total || 0)
                    pages.current = Math.ceil((data.total || 0) / PAGE_SIZE)
                    currentPage.current = data.page || 1
                }
            } else {
                emptyData.current = true
                emtyText.current = "В этой коллекции пока нет товаров"
                setRefresh(prev => !prev)
            }
        } catch (error) {
            console.error('Error loading collection:', error)
            emptyData.current = true
            emtyText.current = "Ошибка загрузки коллекции"
            setRefresh(prev => !prev)
        } finally {
            setLoading(false)
            dispatch(finishLoading())
        }
    }, [collection, router.isReady, convertFiltersData, dispatch, initialData, isFirmMapReady])

    // Инициализация - только если нет SSR данных и firmMap готов
    useEffect(() => {
        if (isHydrated.current || initialData) return

        if (router.isReady && collection && isFirmMapReady && Object.keys(typesVal).length > 0) {
            loadCollection()
        }
    }, [router.isReady, collection, typesVal, initialData, loadCollection, isFirmMapReady])

    // ============================================================
    // 🔄 ОБНОВЛЕНИЕ СТРАНИЦЫ (аналогично SearchPage)
    // ============================================================
    const updatePage = useCallback((respData: any) => {
        dispatch(finishLoading())
        if (respData.products.length === 0) {
            emptyData.current = true
            emtyText.current = "По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу."
            setRefresh(prev => !prev)
        } else {
            emptyData.current = false
            pages.current = Math.ceil(respData.total / PAGE_SIZE)
            const data = convertFiltersData(respData.filters)
            setFiltersState(data)
            settingsModuleMemo.current = !settingsModuleMemo.current
            setMerchFieldData(respData.products)
            setTotalCount(respData.total || 0)
        }
    }, [convertFiltersData, dispatch])

    const updatMerch = useCallback((respData: any) => {
        pages.current = Math.ceil(respData.total / PAGE_SIZE)
        if (respData.products.length === 0) {
            emptyData.current = true
            emtyText.current = "По запросу ничего не найдено. Сбросить фильтры"
            setRefresh(prev => !prev)
        } else {
            emptyData.current = false
            setMerchFieldData(respData.products)
            setTotalCount(respData.total || 0)
        }
    }, [])

    // ============================================================
    // 🔍 ПОИСК ДАННЫХ (аналогично SearchPage)
    // ============================================================
    const searchData = useCallback(() => {
        if (!collection || !router.isReady) return
        if (!isFirmMapReady) return // Ждем загрузку firmMap

        const params: any = {
            page: currentPage.current,
            size: PAGE_SIZE,
            sortType: orderType.current,
            filters: {
                sizes: filtersInfo.current.sizes,
                firms: filtersInfo.current.firms,
                types: filtersInfo.current.types,
                bodytypes: filtersInfo.current.bodytypes,
                lines: filtersInfo.current.lines,
                price_min: Math.round(filtersInfo.current.price[0]) || 0,
                price_max: Math.round(filtersInfo.current.price[1]) || 100000,
                in_store: filtersInfo.current.store,
                // with_price: filtersInfo.current.withPrice,
                rule_ids: filtersInfo.current.rule_ids
            }
        }

        if (searchWord.current) {
            params.search = searchWord.current
        }

        getCollectionProducts(collectionId.current, params)
            .then(data => {
                scrollToTop()
                if (currentPage.current === 1) {
                    updatePage(data)
                } else {
                    updatMerch(data)
                }
            })
            .catch(error => {
                console.error('Error searching products:', error)
                emptyData.current = true
                emtyText.current = "Ошибка загрузки товаров"
                setRefresh(prev => !prev)
                dispatch(finishLoading())
            })
    }, [collection, router.isReady, isFirmMapReady, updatePage, updatMerch, dispatch])

    // ============================================================
    // 🎯 ОБРАБОТЧИКИ (аналогично SearchPage)
    // ============================================================
    const searchNameCallback = useCallback((name: string) => {
        searchWord.current = name
        currentPage.current = 1
        searchData()
    }, [searchData])

    const onFiltersChange = useCallback((filter: any) => {
        switch (filter.id) {
            case "sizes":
                filtersInfo.current.sizes = filter.data || []
                break
            case "firms":
                filtersInfo.current.firms = (filter.data || [])
                    .map((slug: string) => firmMapRef.current[slug]?.id)
                    .filter(Boolean)
                break
            case "lines":
                filtersInfo.current.lines = (filter.data || [])
                    .map((slug: string) => lineMapRef.current[slug]?.id)
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

            // Обновляем priceProps
            newState.priceProps = {
                ...newState.priceProps,
                dataLeft: filtersInfo.current.price[0] || newState.priceProps.min,
                dataRight: filtersInfo.current.price[1] || newState.priceProps.max
            }

            // Обновляем чекбоксы
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
                            const firm = Object.values(firmMapRef.current).find(f => f.slug === item.id)
                            return {
                                ...item,
                                activeData: firm ? filtersInfo.current.firms.includes(firm.id) : false
                            }
                        })
                        break
                    case "lines":
                        newSection.props = section.props.map(item => {
                            const line = Object.values(lineMapRef.current).find(l => l.slug === item.id)
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

            // Обновляем solo чекбоксы
            newState.soloDataProps = newState.soloDataProps.map(item => ({
                ...item,
                activeData: item.id === 'withPrice'
                    ? (filtersInfo.current.withPrice ?? true)
                    : (filtersInfo.current.store ?? false)
            }))

            return newState
        })

        // При изменении фильтров - перезагружаем
        currentPage.current = 1
        searchData()
    }, [searchData])

    const orderTypeChange = useCallback((ind: number | string) => {
        orderType.current = Number(ind)
        currentPage.current = 1
        searchData()
    }, [searchData])

    const pageChange = useCallback((page: number) => {
        currentPage.current = page
        searchData()
    }, [searchData])

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
            const data = convertFiltersData(collectionBaseFilters.current)
            setFiltersState(data)
        }
        searchData()
    }, [searchData, convertFiltersData])
    const scrollToTop = useCallback(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // или 'auto' для мгновенного скролла
        });
    }, []);
    // ============================================================
    // 🪟 STICKY ЭФФЕКТ
    // ============================================================
    useEffect(() => {
        if (!rightBlockRef.current) return;
        let rafId: number | null = null;
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                if (!rightBlockRef.current) return;
                const rightRect = rightBlockRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const blockHeight = rightRect.height;
                const minTopOffset = 120;
                const currentScrollY = window.scrollY;
                const delta = currentScrollY - lastScrollY;
                lastScrollY = currentScrollY;
                const shouldBeSticky = rightRect.top <= minTopOffset;

                if (blockHeight <= windowHeight - minTopOffset) {
                    setIsSticky(shouldBeSticky);
                    if (shouldBeSticky) {
                        const newTop = minTopOffset;
                        if (delta < 0) {
                            if (stickyTopRef.current !== newTop) {
                                stickyTopRef.current = newTop;
                                setStickyTop(newTop);
                            }
                        } else {
                            if (stickyTopRef.current !== 0) {
                                stickyTopRef.current = 0;
                                setStickyTop(0);
                            }
                        }
                    }
                } else {
                    if (isSticky) {
                        let newTop = stickyTopRef.current - delta;
                        const maxTop = 120;
                        const minTop = windowHeight - blockHeight;
                        newTop = Math.max(minTop, Math.min(maxTop, newTop));
                        if (Math.abs(stickyTopRef.current - newTop) > 0.5) {
                            stickyTopRef.current = newTop;
                            setStickyTop(newTop);
                        }
                    } else {
                        if ((delta < 0 && rightRect.top <= minTopOffset) ||
                            (delta > 0 && rightRect.bottom <= windowHeight)) {
                            setIsSticky(true);
                            const initialTop = Math.max(
                                windowHeight - blockHeight,
                                Math.min(120, rightRect.top)
                            );
                            stickyTopRef.current = initialTop;
                            setStickyTop(initialTop);
                        }
                    }
                }
                rafId = null;
            });
        };

        const resizeObserver = new ResizeObserver(() => {
            setTimeout(() => handleScroll(), 0);
        });

        resizeObserver.observe(rightBlockRef.current);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isSticky]);

    // ============================================================
    // 🎨 АДАПТИВ
    // ============================================================
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

    // ============================================================
    // 🔒 БЛОКИРОВКА СКРОЛЛА
    // ============================================================
    useEffect(() => {
        if (showSortPanel || showFiltersPanel) {
            document.body.classList.add('modalOpen')
        } else {
            document.body.classList.remove('modalOpen')
        }
        return () => document.body.classList.remove('modalOpen')
    }, [showSortPanel, showFiltersPanel])

    // ============================================================
    // 🧹 CLEANUP
    // ============================================================
    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

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
                        className={{
                            main: s.searchInput,
                        }}
                        val={searchWord.current}
                        searchCallback={searchNameCallback}
                        selectList={(data) => navigate('/product/' + data)}
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
                <div style={{ position: "relative", display: "flex", alignItems: "flex-start" }}>
                    {emptyData.current ? (

                        <div className={s.emptyRow}>
                            {emtyText.current}
                            {emtyText.current.includes('Сбросить фильтры') && (
                                <span onClick={resetFilters}> Сбросить фильтры</span>
                            )}

                        </div>

                    ) : (
                        <MerchSliderField
                            onChange={pageChange}
                            currentPage={currentPage.current}
                            pages={pages.current}
                            heightRow={300}
                            size={grid ? 2 : 3}
                            data={merchFieldData}
                        />
                    )}
                    {!widthProps && (
                        <div
                            ref={rightBlockRef}
                            style={{
                                width: "25%",
                                position: isSticky ? "sticky" : "relative",
                                top: isSticky ? `${stickyTop}px` : "0px",
                                height: "fit-content",
                                alignSelf: "flex-start",
                                transition: "none"
                            }}
                        >
                            <ProductsFilters
                                classNames={{ secondPage: s.secondPage }}
                                onChange={onFiltersChange}
                                {...filtersState}
                            />
                        </div>
                    )}
                </div>
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

// ============================================================
// 🔥 SSR
// ============================================================
export const getServerSideProps: GetServerSideProps = async (context) => {
    const { collection } = context.params || {}

    if (!collection) {
        return {
            props: {
                initialData: null,
                collectionSlug: null
            }
        }
    }

    try {
        const data = await getCollectionBySlug(collection as string)

        return {
            props: {
                initialData: {
                    collection: data.collection || null,
                    products: data.products || [],
                    filters: data.filters || null,
                    total: data.total || 0,
                    page: data.page || 1
                },
                collectionSlug: collection as string
            }
        }
    } catch (error) {
        console.error('SSR failed for collection:', error)
        return {
            props: {
                initialData: null,
                collectionSlug: collection as string
            }
        }
    }
}

export default React.memo(CollectionPage)