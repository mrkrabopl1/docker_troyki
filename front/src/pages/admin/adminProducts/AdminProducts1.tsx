// pages/admin/ProductVisibility/AdminProductVisibility.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router';
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import Button from 'src/components/Button'
import RadioGroup from 'src/components/radio/RadioGroup'
import s from "./style1.module.css"
import { useAppSelector } from 'src/store/hooks/redux'
import { ReactComponent as Filter } from '/public/filter.svg'
import { ReactComponent as SortIcon } from '/public/sort.svg'
import AdminMerchField from 'src/modules/merchField/AdminMerchFieldGrid';
import { ProductInfo } from 'src/types/adminProduct'
import {
  getAdminProducts,
  getAdminProductsAndFilters,
  updateProductVisibility,
  bulkUpdateVisibility,
  updateFirmVisibility,
  updateTypeVisibility,
  VisibilityFilters,
  bulkUpdateProductStatus,
} from 'src/providers/adminProductsProvider';

const AdminProducts: React.FC = () => {
  const router = useRouter();
  const { typesVal, categories } = useAppSelector(state => state.menuReducer);

  const filtersInfo = useRef({
    sizes: [],
    price: [],
    firms: [],
    types: [],
    updated_from:0,
    created_from:0,
    store: false,
    discount: false,
    withPrice: true,
    is_active: undefined
  })

  const [products, setProducts] = useState<ProductInfo[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    active_percent: 0
  })

  const emptyData = useRef(false)
  const emtyText = useRef("По запросу ничего не найдено.")
  const activeSizes = useRef<string[]>([])
  const firms = useRef<string[]>([])
  const searchWord = useRef("")
  const categoryRef = useRef(0)
  const typeRef = useRef(0)
  const currentPage = useRef(1)
  const pages = useRef(1)
  const pageSize = useRef(24)
  const orderType = useRef(0)
  const [filtersState, setFilters] = useState<any>({
    priceProps: { max: 0, min: 0 },
    checboxsProps: [],
    soloDataProps: [],
    timeProps: []
  })

  const handleProducts = useCallback((data) => {
    if (data.products.length === 0) {
      emptyData.current = true
      setProducts([])
    } else {
      emptyData.current = false
      setProducts(data.products)
      pages.current = Math.ceil(data.totalCount / pageSize.current)

      if (data.filters) {
        const converted = convertFiltersData(data.filters)
        setFilters(converted)
      }
      setStats({
        total_products: data.totalCount,
        active_products: data.activeCount,
        inactive_products: data.totalCount - data.activeCount,
        active_percent: (data.activeCount / data.totalCount) * 100
      })
    }
    setLoading(false)
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      await getAdminProducts(
        handleProducts,
        currentPage.current,
        pageSize.current,
        filtersInfo.current,
        orderType.current,
        searchWord.current,
      )
    } catch (error) {
      console.error('Error loading products:', error)
      setLoading(false)
    }
  }, [])

  const loadProductsAndFilters = useCallback(async () => {
    setLoading(true)
    try {
      await getAdminProductsAndFilters(
        handleProducts,
        currentPage.current,
        pageSize.current,
        orderType.current,
      )
    } catch (error) {
      console.error('Error loading products:', error)
      setLoading(false)
    }
  }, [])

  const handleUpdateStatus = async (productId: number, isActive: boolean) => {
    try {
      await updateProductVisibility(productId, isActive, (response) => {
        console.log(response.message)

        setProducts(prev => prev.map(p => {
          console.debug(p.id === productId ? { ...p, is_active: isActive } : p)
          return p.id === productId ? { ...p, status: isActive ? "active" : "draft" } : p
        }

        ))
      })
    } catch (error) {
      console.error('Error updating product status:', error)
    }
  }

  const handleBulkUpdate = async (isActive: boolean) => {
    if (selectedProducts.size === 0) {
      alert('Выберите товары')
      return
    }

    setBulkActionLoading(true)
    try {
      await bulkUpdateProductStatus(
        { product_ids: Array.from(selectedProducts), status: isActive ? "active" : "draft" },
        (response) => {
          console.log(response.message)
          setProducts(prev => prev.map(p => {
            console.debug(selectedProducts)

            return selectedProducts.has(p.id) ? { ...p, is_active: isActive } : p
          }

          ))
          setSelectedProducts(new Set())
          setSelectAll(false)
        }
      )
    } catch (error) {
      console.error('Error bulk updating:', error)
    } finally {
      setBulkActionLoading(false)
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

  const handleUpdateTypeStatus = async (typeId: number, isActive: boolean) => {
    try {
      await updateTypeVisibility(typeId, isActive, (response) => {
        console.log(`${response.updated_count} товаров обновлено`)
        setProducts(prev => prev.map(p =>
          p.type_id === typeId ? { ...p, is_active: isActive } : p
        ))
      })
    } catch (error) {
      console.error('Error updating type status:', error)
    }
  }

  const convertFiltersData = useCallback((resData: any) => {
    const priceProps = {
      min: resData.price?.[0] || 0,
      max: resData.price?.[1] || 100000,
      dataLeft: filtersInfo.current.price?.[0] || resData.price?.[0] || 0,
      dataRight: filtersInfo.current.price?.[1] || resData.price?.[1] || 100000
    }

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

    const checkBoxPropsTypeData: any[] = []
    if (resData.types) {
      resData.types.forEach((typeId: number) => {
        const typeDescr = typesVal[typeId];
        if (!typeDescr) return;
        const active = filtersInfo.current.types?.includes(typeId) || false
        checkBoxPropsTypeData.push({
          enable: true,
          activeData: active,
          name: typeDescr.name
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
        { id: "type", name: "Типы товара", props: checkBoxPropsTypeData }
      ],
      soloDataProps: [
        { name: "На витрине", activeData: filtersInfo.current.is_active === true, enable: true },
        { name: "Скрытые", activeData: filtersInfo.current.is_active === false, enable: true },
        { name: "Со скидкой", activeData: filtersInfo.current.discount || false, enable: true }
      ],
      timeProps: [
        { name: "Создано", id: "created_from", value: filtersInfo.current.created_from },
        { name: "Обновлено", id: "updated_from", value: filtersInfo.current.updated_from }
      ]
    }
  }, [typesVal])

  const onFiltersChange = useCallback((filter: any) => {
    switch (filter.id) {
      case "sizes":
        filter.data.forEach((data: boolean, index: number) => {
          const size = activeSizes.current[index]
          const sizeIndex = filtersInfo.current.sizes?.indexOf(size) || -1
          if (sizeIndex !== -1 && !data) {
            filtersInfo.current.sizes = filtersInfo.current.sizes?.filter(s => s !== size) || []
          } else if (data && activeSizes.current.includes(size)) {
            filtersInfo.current.sizes = [...(filtersInfo.current.sizes || []), size]
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
      case "solo":
        if (filter.data[0]) filtersInfo.current.is_active = true
        else if (filter.data[1]) filtersInfo.current.is_active = false
        else filtersInfo.current.is_active = undefined
        filtersInfo.current.discount = filter.data[2]
        break
    }
    currentPage.current = 1
    loadProducts()
  }, [loadProducts])

  const searchCallback = useCallback((searchData: string) => {
    searchWord.current = searchData
    currentPage.current = 1
    loadProducts()
  }, [loadProducts])

  const pageChange = useCallback((page: number) => {
    currentPage.current = page
    loadProducts()
  }, [loadProducts])

  const orderTypeChange = useCallback((ind: number) => {
    orderType.current = ind
    loadProducts()
  }, [loadProducts])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectProduct = useCallback((id: number) => {
    setSelectedProducts(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      setSelectAll(newSelected.size === products.length && products.length > 0)
      return newSelected
    })
  }, [products])

  useEffect(() => {
    loadProductsAndFilters()
  }, [])

  // Блокируем скролл при открытых модалках
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

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Управление видимостью товаров</h2>
        <Button text="Назад" onClick={() => router.push('/admin')} />
      </div>

      {/* Статистика */}
      <div className={s.statsBar}>
        <div className={s.statItem}>
          <span className={s.statLabel}>Всего товаров:</span>
          <span className={s.statValue}>{stats.total_products}</span>
        </div>
        <div className={s.statItem}>
          <span className={s.statLabel}>На витрине:</span>
          <span className={s.statValueActive}>{stats.active_products}</span>
        </div>
        <div className={s.statItem}>
          <span className={s.statLabel}>Скрыто:</span>
          <span className={s.statValueInactive}>{stats.inactive_products}</span>
        </div>
        <div className={s.statItem}>
          <span className={s.statLabel}>Активность:</span>
          <span className={s.statValue}>{stats.active_percent}%</span>
        </div>
      </div>

      {/* Панель массовых действий */}
      <div className={s.bulkActionsPanel}>
        <div className={s.selectionInfo}>
          <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
          <span>Выбрано: {selectedProducts.size}</span>
        </div>
        <div className={s.bulkButtons}>
          <button
            onClick={() => handleBulkUpdate(true)}
            disabled={bulkActionLoading || selectedProducts.size === 0}
            className={s.addToShowcaseBtn}
          >
            ➕ Добавить на витрину
          </button>
          <button
            onClick={() => handleBulkUpdate(false)}
            disabled={bulkActionLoading || selectedProducts.size === 0}
            className={s.removeFromShowcaseBtn}
          >
            👁️‍🗨️ Скрыть с витрины
          </button>
        </div>
      </div>

      {/* Поиск, сортировка и фильтры */}
      <div className={s.controlsBar}>
        <button
          className={s.sortBtn}
          onClick={() => setShowSortPanel(true)}
        >
          <SortIcon /> Сортировка
        </button>

        <div className={s.searchWrapper}>
          <SearchWithList
            val={searchWord.current}
            searchCallback={searchCallback}
            selectList={(data) => router.push('/product/' + data)}
          />
        </div>

        <button
          className={s.filterBtn}
          onClick={() => setShowFiltersPanel(true)}
        >
          <Filter /> Фильтры
        </button>
      </div>

      {/* Групповые действия */}
      <div className={s.groupActions}>
        <div className={s.groupActionsTitle}>Быстрые действия с группами:</div>
        <div className={s.groupButtons}>
          {firms.current.slice(0, 10).map(firm => (
            <div key={firm} className={s.groupActionItem}>
              <span>{firm}</span>
              <button onClick={() => handleUpdateFirmStatus(firm, true)}>➕</button>
              <button onClick={() => handleUpdateFirmStatus(firm, false)}>👁️‍🗨️</button>
            </div>
          ))}
        </div>
      </div>

      {/* Список товаров */}
      {loading ? (
        <div className={s.loader}>Загрузка...</div>
      ) : emptyData.current ? (
        <div className={s.emptyRow}>{emtyText.current}</div>
      ) : (
        <AdminMerchField
          products={products}
          selectedProducts={selectedProducts}
          currentPage={currentPage.current}
          totalPages={pages.current}
          onPageChange={pageChange}
          onSelectProduct={handleSelectProduct}
          onStatusToggle={handleUpdateStatus}
        />
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

      {/* Модальное окно фильтров */}
      {showFiltersPanel && (
        <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
          <div className={s.modalPanelRight} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>Фильтры</h3>
              <button onClick={() => setShowFiltersPanel(false)}>✕</button>
            </div>
            <ProductsFilters
              classNames={{ secondPage: s.secondPage }}
              memo={true}
              onChange={onFiltersChange}
              {...filtersState}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProducts