// pages/admin/ProductVisibility/AdminProductVisibility.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Button from 'src/components/Button'
import Modal from 'src/components/modal/Modal'
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import Combobox from 'src/components/combobox/Combobox'
import NumInput from 'src/components/input/NumInput'
import { ReactComponent as Filter } from '/public/filter.svg'
import { ReactComponent as SortIcon } from '/public/sort.svg'
import RadioGroup from 'src/components/radio/RadioGroup'
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import { ProductInfo } from 'src/types/adminProduct'
import {
  getAdminProducts,
  getAdminProductsAndFilters,
  updateProductVisibility,
  bulkUpdateProductStatus,
  bulkUpdateProductsPrice,
  bulkUpdateProductsDiscount,
  updateFirmVisibility,
  updateTypeVisibility,
} from 'src/providers/adminProductsProvider'
import {
  getActiveDiscountRules,
  getDiscountRules,
  bulkAddRuleItems
} from 'src/providers/adminProvider'
import s from "./style.module.css"
import DiscountManager from 'src/modules/admin/discountManager/DiscountManager';
import { finishLoading } from 'src/store/reducers/loadingSlice'

type BulkAction = 'none' | 'discount' | 'price' | 'active'
type SelectMode = 'none' | 'page' | 'all'

const AdminProducts: React.FC = () => {
  const router = useRouter()
  const { typesVal, firmMap, discountRules } = useAppSelector(state => state.menuReducer)

  // Данные
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Статистика
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    percent: 0
  })

  // Поиск и пагинация
  const [searchQuery, setSearchQuery] = useState('')
  const currentPage = useRef(1)
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [totalPages, setTotalPages] = useState(1)
  const firstLoad = useRef(false)
  const pageSize = 24
  const searchTimeoutRef = useRef<any>()

  // Сортировка
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Фильтры
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [filters, setFilters] = useState<any>({
    price: [],
    sizes: [],
    firms: [],
    types: [],
    is_active: undefined,
    discount: false,
    created_from: null,
    updated_from: null,
  })
  const [filtersState, setFiltersState] = useState<any>({
    priceProps: { max: 0, min: 0 },
    checboxsProps: [],
    soloDataProps: [],
    timeProps: []
  })
  const dispatch = useAppDispatch();
  const activeSizes = useRef<string[]>([])
  const firms = useRef<string[]>([])
  const typesIds = useRef<number[]>([])
  // Массовое управление
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction>('none')
  const [selectMode, setSelectMode] = useState<SelectMode>('none')
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [excludedProductIds, setExcludedProductIds] = useState<number[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)

  // Параметры массовых действий
  const [allRules, setAllRules] = useState<any[]>([])
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null)
  const [selectedPriceType, setSelectedPriceType] = useState<'increase' | 'decrease'>('increase')
  const [selectedPriceValue, setSelectedPriceValue] = useState(0)
  const [selectedActive, setSelectedActive] = useState<boolean | null>(null)
  const convertFiltersData = useCallback((resData: any) => {
    const priceProps = {
      min: resData.price?.[0] || 0,
      max: resData.price?.[1] || 100000,
    }

    activeSizes.current = []
    firms.current = []
    const checkBoxPropsData: any[] = []

    if (resData.sizes) {
      Object.entries(resData.sizes).forEach(([size]) => {
        activeSizes.current.push(size)
        checkBoxPropsData.push({
          enable: true,
          activeData: filters.sizes?.includes(size) || false,
          name: size
        })
      })
    }

    const checkBoxPropsTypeData: any[] = []
    if (resData.types) {
      resData.types.forEach((typeId: number) => {
        const typeDescr = typesVal[typeId]
        if (!typeDescr) return
        typesIds.current.push(typeId)
        checkBoxPropsTypeData.push({
          enable: true,
          activeData: filters.types?.includes(typeId) || false,
          name: typeDescr.name,
          id: typeId
        })
      })
    }

    const checkBoxPropsFirmData: any[] = []
    Object.entries(resData.firmsCount || {}).forEach(([firm]) => {
      firms.current.push(firm)
      checkBoxPropsFirmData.push({
        enable: true,
        activeData: filters.firms?.includes(firm) || false,
        name: firm
      })
    })

    setFiltersState({
      priceProps,
      checboxsProps: [
        { id: "sizes", name: "Размеры", props: checkBoxPropsData },
        { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
        { id: "type", name: "Типы товара", props: checkBoxPropsTypeData }
      ],
      soloDataProps: [
        { name: "На витрине", activeData: filters.is_active === true, enable: true },
        { name: "Скрытые", activeData: filters.is_active === false, enable: true },
        { name: "Со скидкой", activeData: filters.discount || false, enable: true }
      ],
      timeProps: [
        { name: "Создано", id: "created_from", value: filters.created_from },
        { name: "Обновлено", id: "updated_from", value: filters.updated_from }
      ]
    })
  }, [typesVal, filters])
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      let sortType = 0
      if (sortField && sortDirection) {
        const sortMap: Record<string, Record<string, number>> = {
          name: { asc: 1, desc: 2 },
          price: { asc: 3, desc: 4 },
          brand: { asc: 5, desc: 6 },
          discount: { asc: 7, desc: 8 },
          created_at: { asc: 9, desc: 10 },
          updated_at: { asc: 11, desc: 12 },
          status: { asc: 12, desc: 13 },
        }
        sortType = sortMap[sortField]?.[sortDirection] || 0
      }

      const handleData = (data: any) => {
        if (data.products.length === 0) {
          setProducts([])
        } else {
          setProducts(data.products)
          setTotalPages(Math.ceil(data.totalCount / pageSize))

          if (data.filters) {
            convertFiltersData(data.filters)
          }

          setStats({
            total: data.totalCount,
            active: data.activeCount,
            inactive: data.totalCount - data.activeCount,
            percent: Math.round((data.activeCount / data.totalCount) * 100)
          })
        }
        setLoading(false)
      }

      await getAdminProducts(
        handleData,
        currentPage.current,
        pageSize,
        filters,
        sortType,
        searchQuery,
      )
    } catch (error) {
      console.error('Error loading products:', error)
      setLoading(false)
    }
  }, [searchQuery, sortField, sortDirection, currentPage.current, filters])


  const handleData = useCallback((data: any) => {
    if (data.products.length === 0) {
      setProducts([])
    } else {
      setProducts(data.products)
      setTotalPages(Math.ceil(data.totalCount / pageSize))

      if (data.filters) {
        convertFiltersData(data.filters)
      }

      setStats({
        total: data.totalCount,
        active: data.activeCount,
        inactive: data.totalCount - data.activeCount,
        percent: Math.floor((data.activeCount / data.totalCount) * 100)
      })
    }
    setLoading(false)
  }, [convertFiltersData])
  const loadProductsAndFilters = useCallback(async () => {
    setLoading(true)
    try {
      await getAdminProductsAndFilters(
        handleData,
        currentPage.current,
        pageSize,
        0,
      )
      dispatch(finishLoading());
    } catch (error) {
      console.error('Error loading products:', error)
      setLoading(false)
    }
  }, [typesVal])

  const loadAllRules = async () => {
    try {
      const data = await getActiveDiscountRules(1, 100)
      setAllRules(data.rules || [])
    } catch (error) {
      console.error('Error loading rules:', error)
    }
  }



  useEffect(() => {
    if (typesVal && Object.keys(typesVal).length > 0) {
      firstLoad.current = true
      loadProductsAndFilters()
    }

  }, [typesVal])
  useEffect(() => {
    if (firstLoad) {
      loadProducts()
    }

  }, [loadProducts])
  useEffect(() => {
    if (bulkMode && bulkAction === 'discount') loadAllRules()
  }, [bulkMode, bulkAction])

  const handleSearch = (value: string) => {
    currentPage.current = 1
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => setSearchQuery(value), 300)
  }
  const handlePageChange = useCallback((value: number) => {
    currentPage.current = value
    loadProducts()
  }, [filters, sortField, sortDirection, searchQuery])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  const handleFilterReset = useCallback(() => {
    setFilters({
      sizes: [],
      price: [],
      firms: [],
      types: [],
      is_active: undefined,
      discount: false
    })
  }, [])
  const handleFiltersChange = useCallback((filter: any) => {
    const newFilters = { ...filters }
    switch (filter.id) {
      case "sizes":
        newFilters.sizes = []
        filter.data.forEach((data: boolean, index: number) => {
          if (data) newFilters.sizes.push(activeSizes.current[index])
        })
        break
      case "price":
        newFilters.price = filter.data
        break
      case "firms":
        newFilters.firms = []
        filter.data.forEach((data: boolean, index: number) => {
          if (data) newFilters.firms.push(firmMap[firms.current[index]])
        })
        break
      case "type":
        newFilters.types = []
        filter.data.forEach((data: boolean, index: number) => {
          if (data) newFilters.types.push(typesIds.current[index])
        })
        break
      case "solo":
        if (filter.data[0]) newFilters.is_active = true
        else if (filter.data[1]) newFilters.is_active = false
        else newFilters.is_active = undefined
        newFilters.discount = filter.data[2]
        break
      // case "updated_from":  
      // case "created_from":  
      //   newFilters.t
      default:
        newFilters[filter.id] = filter.data
    }
    setFilters(newFilters)
    currentPage.current = 1
  }, [filters])

  const applyFilters = () => {
    setShowFiltersPanel(false)
    loadProducts()
  }
  const filtersStateWithValues = useMemo(() => {
    if (!filtersState.checboxsProps) return filtersState

    return {
      priceProps: { ...filtersState.priceProps, dataLeft: filters.price[0] || filtersState.priceProps.min, dataRigth: filters.price[1] || filtersState.priceProps.max },
      checboxsProps: filtersState.checboxsProps.map((group: any) => ({
        ...group,
        props: group.props.map((prop: any) => {
          let activeData = false

          if (group.id === 'sizes') {
            activeData = filters.sizes?.includes(prop.name) || false
          } else if (group.id === 'firms') {
            const firmId = firmMap[prop.name]
            activeData = filters.firms?.includes(firmId) || false
          } else if (group.id === 'type') {
            // Для типов нужно найти ID по имени
            const typeEntry = Object.entries(typesVal).find(
              ([_, t]: [string, any]) => t.name === prop.name
            )
            activeData = filters.types?.includes(prop.id)
            console.debug(Number(typeEntry[0]))
            if (activeData) {
              console.debug("ddddddddddddd")
            }
          }

          return { ...prop, activeData }
        })
      })),
      discountProps: discountRules,
      soloDataProps: filtersState.soloDataProps.map((prop: any, index: number) => ({
        ...prop,
        activeData: index === 0 ? filters.is_active === true :
          index === 1 ? filters.is_active === false :
            filters.discount || false
      })),
      timeProps: filtersState.timeProps.map((prop: any) => ({
        ...prop,
        value: filters[prop.id]?.split('T')[0] || null
      }))
    }
  }, [filtersState, filters, firmMap, typesVal])
  const handleToggleActive = async (productId: number, isActive: boolean) => {
    try {
      await updateProductVisibility(productId, isActive, (response) => {
        console.log(response.message)
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, status: isActive ? "active" : "archived" } : p
        ))
      })
    } catch (error) {
      console.error('Error updating product status:', error)
    }
  }

  const isProductSelected = (productId: number) => {
    if (selectMode === 'all') {
      return !excludedProductIds.includes(productId)
    }
    return selectedProductIds.includes(productId)
  }

  const toggleProductSelection = (productId: number) => {
    if (selectMode === 'all') {
      setExcludedProductIds(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      )
    } else {
      setSelectedProductIds(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      )
    }
  }

  const toggleAllProducts = () => {
    if (selectMode === 'none') {
      setSelectedProductIds(products.map(p => p.id))
      setSelectMode('page')
    } else if (selectMode === 'page' && stats.total > pageSize) {
      setSelectMode('all')
      setSelectedProductIds([])
      setExcludedProductIds([])
    } else {
      setSelectMode('none')
      setSelectedProductIds([])
      setExcludedProductIds([])
    }
  }

  const getSelectedCount = () => {
    if (selectMode === 'all') {
      return stats.total - excludedProductIds.length
    }
    return selectedProductIds.length
  }

  const enterBulkMode = (action: BulkAction) => {
    setBulkMode(true)
    setBulkAction(action)
    setSelectMode('none')
    setSelectedProductIds([])
    setExcludedProductIds([])
    setBulkResult(null)
    setSelectedRuleId(null)
    setSelectedPriceValue(0)
    setSelectedPriceType('increase')
    setSelectedActive(null)
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setBulkAction('none')
    setSelectMode('none')
    setSelectedProductIds([])
    setExcludedProductIds([])
    setBulkResult(null)
    setSelectedRuleId(null)
    setSelectedPriceValue(0)
    setSelectedPriceType('increase')
    setSelectedActive(null)
  }

  const handleBulkApply = async () => {
    const selectedCount = getSelectedCount()
    if (selectedCount === 0) return

    setBulkLoading(true)
    setBulkResult(null)

    try {
      const basePayload = selectMode === 'all'
        ? {
          select_all: true,
          filters: filters,
          search: searchQuery,
          exclude_ids: excludedProductIds
        }
        : {
          product_ids: selectedProductIds
        }

      if (bulkAction === 'discount' && selectedRuleId) {
        await bulkUpdateProductsDiscount({
          ...basePayload,
          rule_id: selectedRuleId
        }, (response: any) => {
          setBulkResult(`Скидка обновлена у ${response.updated_count || selectedCount} товаров`)
        })
      } else if (bulkAction === 'price' && selectedPriceValue > 0) {
        await bulkUpdateProductsPrice(
          { ...basePayload, price_type: selectedPriceType, price_value: selectedPriceValue },
          (response: any) => {
            setBulkResult(`Цена обновлена у ${response.updated_count || selectedCount} товаров`)
          }
        )
      } else if (bulkAction === 'active' && selectedActive !== null) {
        await bulkUpdateProductStatus(
          {
            ...basePayload,
            status: selectedActive ? "active" : "draft"
          },
          (response: any) => {
            setBulkResult(`Активность обновлена у ${response.updated_count || selectedCount} товаров`)
          }
        )
      }

      await loadProducts()
      exitBulkMode()
    } catch (error) {
      console.error('Error bulk operation:', error)
      setBulkResult('Ошибка при выполнении операции')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleUpdateFirmStatus = async (firm: string, isActive: boolean) => {
    try {
      await updateFirmVisibility(firm, isActive, (response) => {
        console.log(`${response.updated_count} товаров обновлено`)
        setProducts(prev => prev.map(p =>
          p.firm === firm ? { ...p, is_active: isActive } : p
        ))
      })
    } catch (error) {
      console.error('Error updating firm status:', error)
    }
  }

  useEffect(() => {
    if (showSortPanel || showFiltersPanel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showSortPanel, showFiltersPanel])

  const SortableHeader: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <th className={s.sortableHeader} onClick={() => handleSort(field)}>
      {children}
      {sortField === field && (
        <span className={s.sortIndicator}>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
      )}
    </th>
  )

  const formatPrice = (price: number, oldPrice?: number) => {
    if (!price && price !== 0) return '—'
    return oldPrice && oldPrice > price ? (
      <span>
        <span className={s.currentPrice}>{price.toLocaleString()} ₽</span>
        {' '}
        <span className={s.oldPrice}>{oldPrice.toLocaleString()} ₽</span>
      </span>
    ) : (
      <span>{price.toLocaleString()} ₽</span>
    )
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.titleSection}>
          <h2>Управление видимостью товаров</h2>
          <span className={s.stats}>
            Всего: {stats.total} | На витрине: {stats.active} | Скрыто: {stats.inactive} | Активность: {stats.percent}%
          </span>
        </div>
        <button
          className={s.filterBtn}
          onClick={() => setShowFiltersPanel(true)}
        >
          <Filter /> <span className={s.filterBtnText}>Фильтры</span>
        </button>
        <button
          className={s.sortBtn}
          onClick={() => setShowSortPanel(true)}
        >
          <SortIcon /> <span className={s.filterBtnText}>Сортировка</span>
        </button>
      </div>

      {/* Поиск, сортировка и фильтры */}
      <div className={s.controlsBar}>


        <div className={s.searchWrapper}>
          <SearchWithList
            val={searchQuery}
            searchCallback={handleSearch}
            selectList={(data) => router.push('/product/' + data)}
          />
        </div>
      </div>

      {/* Быстрые действия с группами */}
      {/* <div className={s.groupActions}>
        <div className={s.groupActionsTitle}>Быстрые действия с фирмами:</div>
        <div className={s.groupButtons}>
          {firms.current.slice(0, 10).map(firm => (
            <div key={firm} className={s.groupActionItem}>
              <span>{firm}</span>
              <button onClick={() => handleUpdateFirmStatus(firm, true)}>➕</button>
              <button onClick={() => handleUpdateFirmStatus(firm, false)}>👁️‍🗨️</button>
            </div>
          ))}
        </div>
      </div> */}

      {/* Панель массовых действий */}
      <div className={s.bulkPanel}>
        {!bulkMode ? (
          <div className={s.bulkButtons}>
            <button className={`${s.bulkButton} ${s.bulkButtonDiscount}`} onClick={() => enterBulkMode('discount')}>
              <span className={s.bulkButtonIcon}>🏷️</span>Скидка
            </button>
            <button className={`${s.bulkButton} ${s.bulkButtonPrice}`} onClick={() => enterBulkMode('price')}>
              <span className={s.bulkButtonIcon}>💰</span>Изменить цену
            </button>
            <button className={`${s.bulkButton} ${s.bulkButtonActive}`} onClick={() => enterBulkMode('active')}>
              <span className={s.bulkButtonIcon}>👁️</span>Активность
            </button>
          </div>
        ) : (
          <div className={s.bulkControls}>
            <span className={s.bulkInfo}>
              Выбрано: {getSelectedCount()} из {stats.total}
            </span>

            {bulkAction === 'discount' && (
              <div className={s.bulkFieldGroup}>
                <label>Правило скидки:</label>
                <Combobox
                  data={allRules.reduce((acc, rule, i) => {
                    acc[i] = `${rule.name} (${rule.discount_type === 'percentage' ? `-${rule.discount_value}%` : `-${rule.discount_value}₽`})`
                    return acc
                  }, {} as Record<number, string>)}
                  placeholder="Выберите правило"
                  currentIndex={allRules.findIndex(r => r.id === selectedRuleId)}
                  onChangeIndex={(index) => setSelectedRuleId(allRules[Number(index)]?.id || null)}
                  width={320}
                />
              </div>
            )}

            {bulkAction === 'price' && (
              <div className={s.bulkFieldGroup}>
                <label>Тип изменения:</label>
                <Combobox
                  data={{
                    0: 'Увеличить на',
                    1: 'Уменьшить на'
                  }}
                  placeholder="Выберите действие"
                  currentIndex={selectedPriceType === 'increase' ? 0 : 1}
                  onChangeIndex={(index) => {
                    const types: ('increase' | 'decrease')[] = ['increase', 'decrease']
                    setSelectedPriceType(types[Number(index)])
                  }}
                  width={200}
                />
                <NumInput
                  min={0}
                  max={100}
                  value={selectedPriceValue}
                  onChange={setSelectedPriceValue}
                />
                <span className={s.priceUnit}>{'%'}</span>
              </div>
            )}

            {bulkAction === 'active' && (
              <div className={s.bulkFieldGroup}>
                <label>Установить статус:</label>
                <Combobox
                  data={{ 0: 'Активен (на витрине)', 1: 'Неактивен (скрыт)' }}
                  placeholder="Выберите статус"
                  currentIndex={selectedActive === null ? -1 : (selectedActive ? 0 : 1)}
                  onChangeIndex={(index) => setSelectedActive(Number(index) === 0)}
                  width={240}
                />
              </div>
            )}

            <div className={s.bulkActions}>
              <button
                className={s.bulkApplyBtn}
                onClick={handleBulkApply}
                disabled={
                  getSelectedCount() === 0 ||
                  bulkLoading ||
                  (bulkAction === 'discount' && !selectedRuleId) ||
                  (bulkAction === 'price' && selectedPriceValue === 0) ||
                  (bulkAction === 'active' && selectedActive === null)
                }
              >
                Применить
              </button>
              <button className={s.bulkCancelBtn} onClick={exitBulkMode}>Отмена</button>
            </div>

            {bulkResult && (
              <span className={`${s.bulkResult} ${bulkResult.includes('Ошибка') ? s.error : s.success}`}>
                {bulkResult}
              </span>
            )}
          </div>
        )}
      </div>
      {/* Баннер выбора всех товаров */}
      {bulkMode && selectMode === 'none' && (
        <div className={s.selectAllBanner}>
          <button onClick={toggleAllProducts} className={s.selectAllLink}>
            Выбрать товары на странице
          </button>
        </div>
      )}

      {/* Баннер выбора всех товаров */}
      {bulkMode && selectMode === 'page' && stats.total > pageSize && (
        <div className={s.selectAllBanner}>
          <span>Выбрано {selectedProductIds.length} товаров на странице</span>
          <button onClick={toggleAllProducts} className={s.selectAllLink}>
            Выбрать все {stats.total} товаров
          </button>
        </div>
      )}

      {bulkMode && selectMode === 'all' && (
        <div className={s.selectAllBanner}>
          <span>Выбраны все {getSelectedCount()} товаров</span>
          <button onClick={toggleAllProducts} className={s.selectAllLink}>
            Очистить выбор
          </button>
        </div>
      )}

      {/* Таблица товаров */}
      <div className={s.tableWrapper}>
        <table className={s.productsTable}>
          <thead>
            <tr>
              {bulkMode && (
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectMode !== 'none'}
                    onChange={toggleAllProducts}
                    ref={input => {
                      if (input) input.indeterminate = selectMode === 'page'
                    }}
                  />
                </th>
              )}
              <th style={{ width: 60 }}>Фото</th>
              <SortableHeader field="name">Название</SortableHeader>
              <SortableHeader field="brand">Фирма</SortableHeader>
              <SortableHeader field="price">Цена</SortableHeader>
              <SortableHeader field="updated_at">Обновлен</SortableHeader>
              <SortableHeader field="discount">Скидка</SortableHeader>
              <SortableHeader field="status">Статус</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={bulkMode ? 8 : 7} className={s.loadingCell}>Загрузка...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={bulkMode ? 8 : 7} className={s.emptyCell}>
                  {searchQuery ? 'Товары не найдены' : 'Нет товаров'}
                </td>
              </tr>
            ) : (
              products.map((product: any) => (
                <tr
                  key={product.id}
                  className={`${s.productRow} ${!product.is_active ? s.inactive : ''}`}
                  onClick={() => !bulkMode && router.push(`/admin/products/${product.id}`)}
                  style={{ cursor: bulkMode ? 'default' : 'pointer' }}
                >
                  {bulkMode && (
                    <td data-label="Выбрать" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isProductSelected(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                  )}
                  <td className={s.imageCell} data-label="Фото">
                    {product.image_path ? (
                      <img src={product.image_path} alt={product.name} />
                    ) : (
                      <div className={s.noImage}>—</div>
                    )}
                  </td>
                  <td className={s.nameCell} data-label="Название">
                    <div className={s.productName}>{product.name}</div>
                    {product.article && <div className={s.article}>Арт: {product.article}</div>}
                  </td>
                  <td data-label="Фирма">{product.firm || '—'}</td>
                  <td className={s.priceCell} data-label="Цена">
                    {formatPrice(product.price, product.old_price)}
                  </td>
                  <td data-label="Обновлен">{product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '—'}</td>
                  <td className={s.discountCell} data-label="Скидка">
                    {product.discount ? (
                      <span onClick={(e) => { e.stopPropagation(); setShowDiscountModal(true); setSelectedProduct(product) }} className={s.discountBadge}>-{product.discount}%</span>
                    ) : (
                      <span className={s.noDiscount}>—</span>
                    )}
                  </td>
                  <td data-label="Статус" onClick={e => e.stopPropagation()}>
                    <button
                      className={`${s.statusToggle} ${product.status === "active" ? s.active : s.inactive}`}
                      onClick={() => handleToggleActive(product.id, !(product.status === "active"))}
                      disabled={bulkMode}
                    >
                      {product.status === "active" ? '✓ Витрина' : '✕ Скрыт'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className={s.pagination}>
          <button onClick={() => handlePageChange(Math.max(1, currentPage.current - 1))} disabled={currentPage.current === 1}>←</button>
          <span>{currentPage.current} / {totalPages}</span>
          <button onClick={() => handlePageChange(Math.min(totalPages, currentPage.current + 1))} disabled={currentPage.current === totalPages}>→</button>
        </div>
      )}

      {/* Модальное окно сортировки */}
      {showSortPanel && (
        <div className={s.modalOverlay} onClick={() => setShowSortPanel(false)}>
          <div className={s.modalPanelLeft} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>Сортировка</h3>
              <button onClick={() => setShowSortPanel(false)}>✕</button>
            </div>
            <RadioGroup
              onChange={(ind) => {
                const sortMap: Record<number, { field: string; direction: string }> = {
                  0: { field: '', direction: 'asc' },
                  1: { field: 'name', direction: 'asc' },
                  2: { field: 'name', direction: 'desc' },
                  3: { field: 'price', direction: 'asc' },
                  4: { field: 'price', direction: 'desc' },
                  5: { field: 'brand', direction: 'asc' },
                  6: { field: 'brand', direction: 'desc' },
                  7: { field: 'discount', direction: 'asc' },
                  8: { field: 'discount', direction: 'desc' },
                  9: { field: 'created_at', direction: 'asc' },
                  10: { field: 'created_at', direction: 'desc' },
                  11: { field: 'updated_at', direction: 'asc' },
                  12: { field: 'updated_at', direction: 'desc' },
                  13: { field: 'status', direction: 'asc' },
                  14: { field: 'status', direction: 'desc' },
                }
                const sort = sortMap[ind]
                if (sort) {
                  setSortField(sort.field)
                  setSortDirection(sort.direction)
                }
                setShowSortPanel(false)
              }}
              checked={0}
              name={"ordered"}
              lampArray={[
                "Без сортировки",
                "По имени (А-Я)",
                "По имени (Я-А)",
                "По возрастанию цены",
                "По убыванию цены",
                "По бренду (А-Я)",
                "По бренду (Я-А)",
                "По возрастанию скидки",
                "По убыванию скидки",
                "По дате создания (старые)",
                "По дате создания (новые)",
                "По дате обновления (старые)",
                "По дате обновления (новые)",
                "По статусу (А-Я)",
                "По статусу (Я-А)",
              ]}
            />
          </div>
        </div>
      )}

      {/* Модальное окно фильтров */}
      {showFiltersPanel && (
        <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
          <div className={s.modalPanelRight} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>Фильтры</h3>
              <button onClick={handleFilterReset}>Сбросить</button>
              <button onClick={() => setShowFiltersPanel(false)}>✕</button>
            </div>
            <ProductsFilters
              classNames={{ secondPage: s.secondPage }}
              memo={true}
              onChange={handleFiltersChange}
              {...filtersStateWithValues}
            />
          </div>
        </div>
      )}
      <Modal active={showDiscountModal} onChange={() => { setShowDiscountModal(false); }}>
        {selectedProduct && (
          <div style={{ display: "inline-block" }} onClick={e => e.stopPropagation()}>
            <DiscountManager
              entityId={selectedProduct.id}
              entityType={'product'}
              entityName={selectedProduct.name}
              onClose={() => { setShowDiscountModal(false) }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminProducts 