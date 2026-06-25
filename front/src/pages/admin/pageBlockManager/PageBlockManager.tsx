// pages/admin/PageBlocks/PageBlocksManager.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Button from 'src/components/Button'
import Modal from 'src/components/modal/Modal'
import ProductsFilters from 'src/modules/settingsPanels/ProductsFilters'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'

import { getAdminProductsAndFilters, getAdminProducts } from 'src/providers/adminProductsProvider'
import {
  getPageBlocks,
  createPageBlock,
  updatePageBlock,
  deletePageBlock,
  reorderPageBlocks,
  PageBlock
} from 'src/providers/adminPageBlocksProvider'
import { finishLoading } from 'src/store/reducers/loadingSlice'
import { CheckBoxType } from 'src/types/modules'
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
}

const PageBlocksManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const [filtersVersion, setFiltersVersion] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(finishLoading());
    }, 0);
    return () => clearTimeout(timer);
  }, [dispatch]);
  
  const router = useRouter()
  const { typesVal, firmMap } = useAppSelector(state => state.menuReducer)

  // Список блоков
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [loading, setLoading] = useState(true)

  // Модалка редактирования
  const [showModal, setShowModal] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null)

  const [blockName, setBlockName] = useState('')
  const [minItems, setMinItems] = useState(6)
  const [maxItems, setMaxItems] = useState(20)
  const [isActive, setIsActive] = useState(true)

  // Фильтры - используем useRef для хранения текущих значений
  const filtersInfo = useRef<PageBlock['filters']>({
    sizes: [],
    firms: [],
    types: [],
    price: [0, 100000],
    rule_ids: [],
    in_store: false
  })

  // Состояния фильтров для ProductsFilters
  const [filtersState, setFiltersState] = useState<FiltersState>({
    priceProps: { min: 0, max: 100000, dataLeft: 0, dataRight: 100000 },
    checboxsProps: [],
    soloDataProps: []
  })

  // Предпросмотр товаров
  const [previewProducts, setPreviewProducts] = useState<any[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [errors, setErrors] = useState<{ filters?: boolean }>({})

  // Загрузка всех блоков
  const loadBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPageBlocks()
      setBlocks(data)
    } catch (error) {
      console.error('Error loading blocks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBlocks()
  }, [loadBlocks])

  // Конвертация фильтров для ProductsFilters
  const convertFiltersData = useCallback((resData: any) => {
    if (!resData) return

    const priceProps = {
      min: resData.price?.[0] || 0,
      max: resData.price?.[1] || 100000,
      dataLeft: filtersInfo.current.price?.[0] || resData.price?.[0] || 0,
      dataRight: filtersInfo.current.price?.[1] || resData.price?.[1] || 100000
    }

    // Получаем списки для чекбоксов
    const sizesList = resData.sizes ? Object.keys(resData.sizes) : []
    const firmsList = resData.firmsCount ? Object.keys(resData.firmsCount) : []
    const typesList = resData.types || []
    const discountsList = resData.discounts || []

    // Создаем чекбоксы для размеров
    const checkBoxPropsData: CheckBoxType[] = sizesList.map(size => ({
      id: size,
      enable: true,
      activeData: filtersInfo.current.sizes?.includes(size) || false,
      name: size
    }))

    // Создаем чекбоксы для типов
    const checkBoxPropsTypeData: CheckBoxType[] = typesList.map((typeId: number) => ({
      id: typeId,
      enable: true,
      activeData: filtersInfo.current.types?.includes(typeId) || false,
      name: typesVal[typeId]?.name || `Тип ${typeId}`
    }))

    // Создаем чекбоксы для фирм - важно: firmsList содержит названия, а filtersInfo.firms - ID
    const checkBoxPropsFirmData: CheckBoxType[] = firmsList.map((firm: string) => {
      const firmId = firmMap[firm] || 0
      return {
        id: firmId,
        enable: true,
        activeData: filtersInfo.current.firms?.includes(firmId) || false,
        name: firm
      }
    })

    // Создаем чекбоксы для скидок
    const checkBoxPropsDiscountData: CheckBoxType[] = discountsList.map((discount: any) => ({
      id: discount.id,
      enable: true,
      activeData: filtersInfo.current.rule_ids?.includes(discount.id) || false,
      name: discount.name
    }))

    // Solo чекбоксы
    const soloDataProps: CheckBoxType[] = [
      {
        id: 'in_store',
        enable: true,
        activeData: filtersInfo.current.in_store || false,
        name: "На витрине"
      }
    ]

    // Собираем все группы чекбоксов
    const checboxsProps = [
      { id: "sizes", name: "Размеры", props: checkBoxPropsData },
      { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
      { id: "type", name: "Типы товара", props: checkBoxPropsTypeData }
    ]

    if (discountsList.length > 0) {
      checboxsProps.push({ id: "discounts", name: "Скидки", props: checkBoxPropsDiscountData })
    }

    setFiltersState({
      priceProps,
      checboxsProps,
      soloDataProps
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
            setPreviewProducts(data.products?.slice(0, maxItems) || [])
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
  }, [convertFiltersData, maxItems])

  // Обновление предпросмотра
  const updatePreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const params = {
        sizes: filtersInfo.current.sizes || [],
        firms: filtersInfo.current.firms || [],
        types: filtersInfo.current.types || [],
        price: filtersInfo.current.price || [0, 100000],
        rule_ids: filtersInfo.current.rule_ids || [],
        in_store: filtersInfo.current.in_store || false,
        withPrice: true
      }

      await getAdminProducts(
        (data: any) => {
          setPreviewProducts(data.products?.slice(0, maxItems) || [])
          setPreviewTotal(data.totalCount || 0)
        },
        1,
        maxItems,
        params,
        0,
        ''
      )
    } catch (error) {
      console.error('Preview error:', error)
    } finally {
      setPreviewLoading(false)
    }
  }, [maxItems])

  // Обработчик изменения фильтров из ProductsFilters
  const onFiltersChange = useCallback((filter: any) => {
    switch (filter.id) {
      case "sizes":
        filtersInfo.current.sizes = filter.data || []
        break
      case "firms":
        filtersInfo.current.firms = filter.data || []
        break
      case "type":
        filtersInfo.current.types = filter.data || []
        break
      case "discounts":
        filtersInfo.current.rule_ids = filter.data || []
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
      default:
        break
    }
    setFiltersVersion(prev => prev + 1)
    setErrors(prev => ({ ...prev, filters: false }))
    // Обновляем предпросмотр
    updatePreview()
  }, [updatePreview])

  // Обновляем предпросмотр при открытии модалки
  useEffect(() => {
    if (showModal) {
      updatePreview()
    }
  }, [showModal, updatePreview])

  // Валидация
  const validateForm = (): boolean => {
    const newErrors: { filters?: boolean } = {}

    const hasFilters =
      (filtersInfo.current.firms && filtersInfo.current.firms.length > 0) ||
      (filtersInfo.current.types && filtersInfo.current.types.length > 0) ||
      (filtersInfo.current.sizes && filtersInfo.current.sizes.length > 0) ||
      (filtersInfo.current.rule_ids && filtersInfo.current.rule_ids.length > 0) ||
      (filtersInfo.current.price && filtersInfo.current.price[0] > 0) ||
      filtersInfo.current.in_store

    if (!hasFilters) {
      newErrors.filters = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Сохранение
  const handleSave = async () => {
    if (!blockName.trim()) {
      alert('Введите название блока')
      return
    }

    if (!validateForm()) {
      alert('Выберите хотя бы одно условие для показа товаров')
      return
    }

    const blockData: Omit<PageBlock, 'id'> = {
      name: blockName,
      sort_order: editingBlock?.sort_order ?? blocks.length,
      is_active: isActive,
      filters: {
        sizes: filtersInfo.current.sizes || [],
        firms: filtersInfo.current.firms || [],
        types: filtersInfo.current.types || [],
        price: filtersInfo.current.price || [0, 100000],
        rule_ids: filtersInfo.current.rule_ids || [],
        in_store: filtersInfo.current.in_store || false
      },
      min_items: minItems,
      max_items: maxItems,
      type: "products_slider"
    }

    try {
      if (editingBlock?.id) {
        await updatePageBlock(editingBlock.id, blockData)
      } else {
        await createPageBlock(blockData)
      }
      await loadBlocks()
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Save error:', error)
      alert('Ошибка при сохранении')
    }
  }

  const resetForm = () => {
    setEditingBlock(null)
    setBlockName('')
    filtersInfo.current = {
      sizes: [],
      firms: [],
      types: [],
      price: [0, 100000],
      rule_ids: [],
      in_store: false
    }
    setMinItems(6)
    setMaxItems(20)
    setIsActive(true)
    setPreviewProducts([])
    setPreviewTotal(0)
    setErrors({})
    setFiltersVersion(prev => prev + 1)
  }

  const openModal = (block?: PageBlock) => {
    if (block) {
      setEditingBlock(block)
      setBlockName(block.name)
      filtersInfo.current = {
        sizes: block.filters?.sizes || [],
        firms: block.filters?.firms || [],
        types: block.filters?.types || [],
        price: block.filters?.price || [0, 100000],
        rule_ids: block.filters?.rule_ids || [],
        in_store: block.filters?.in_store || false
      }
      setMinItems(block.min_items || 6)
      setMaxItems(block.max_items || 20)
      setIsActive(block.is_active ?? true)
    } else {
      resetForm()
    }
    setShowModal(true)
    // Загружаем фильтры для отображения
    loadFilters()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить блок?')) return
    try {
      await deletePageBlock(id)
      await loadBlocks()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Формируем текст условий
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
          const found = Object.entries(firmMap).find(([_, id]) => id === firmId)
          return found ? found[0] : null
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

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Управление блоками главной страницы</h2>
        <Button text="+ Добавить блок" onClick={() => openModal()} />
      </div>

      {loading ? (
        <div className={s.loader}>Загрузка...</div>
      ) : blocks.length === 0 ? (
        <div className={s.emptyState}>Нет блоков. Создайте первый блок!</div>
      ) : (
        <div className={s.blocksGrid}>
          {blocks.map((block) => (
            <div key={block.id} className={`${s.blockCard} ${!block.is_active ? s.inactive : ''}`}>
              <div className={s.blockInfo}>
                <h3 className={s.blockTitle}>{block.name}</h3>
                <div className={s.blockMeta}>
                  <span>Порядок: {block.sort_order}</span>
                  <span>Товаров: {block.min_items}–{block.max_items}</span>
                  <span className={block.is_active ? s.active : s.inactive}>
                    {block.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className={s.blockFilters}>
                  {block.filters?.types?.length > 0 && (
                    <span className={s.filterTag}>Типы: {block.filters.types.map(id => typesVal[id]?.name).filter(Boolean).join(', ')}</span>
                  )}
                  {block.filters?.firms?.length > 0 && (
                    <span className={s.filterTag}>Бренды: {block.filters.firms.length}</span>
                  )}
                  {block.filters?.rule_ids?.length > 0 && (
                    <span className={s.filterTag}>Скидки: {block.filters.rule_ids.length}</span>
                  )}
                  {!block.filters?.types?.length && !block.filters?.firms?.length && !block.filters?.rule_ids?.length && (
                    <span className={s.emptyFilters}>Без условий</span>
                  )}
                </div>
              </div>
              <div className={s.blockActions}>
                <button className={s.editBtn} onClick={() => openModal(block)}>✏️ Редактировать</button>
                <button className={s.deleteBtn} onClick={() => handleDelete(block.id!)}>🗑️ Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка редактирования */}
      <Modal active={showModal} onChange={setShowModal}>
        <div onClick={e => e.stopPropagation()} className={s.modalContent}>
          <div className={s.modalHeader}>
            <h3>{editingBlock ? 'Редактировать блок' : 'Новый блок'}</h3>
            <button className={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
          </div>

          <div className={s.formGroup}>
            <label>Название блока *</label>
            <input
              type="text"
              value={blockName}
              onChange={e => setBlockName(e.target.value)}
              placeholder="Новинки, Хиты продаж..."
            />
          </div>

          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label>Мин. товаров (6–20) *</label>
              <input
                type="number"
                min={6}
                max={20}
                value={minItems}
                onChange={e => setMinItems(Number(e.target.value))}
              />
            </div>
            <div className={s.formGroup}>
              <label>Макс. товаров (6–20) *</label>
              <input
                type="number"
                min={6}
                max={20}
                value={maxItems}
                onChange={e => setMaxItems(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={s.formGroup}>
            <label className={s.checkboxLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              Блок активен
            </label>
          </div>

          <div className={s.formGroup}>
            <label>Условия показа товаров <span className={s.required}>*</span></label>

            <div
              className={`${s.urlPreview} ${errors.filters ? s.errorBorder : ''}`}
              onClick={() => setShowFiltersPanel(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className={s.filtersSummary}>
                {getFiltersSummary}
              </div>
              <span className={s.editHint}>✏️ нажмите чтобы настроить</span>
            </div>

            {errors.filters && <div className={s.errorText}>Выберите хотя бы один фильтр</div>}
          </div>

          <div className={s.previewSection}>
            <h4>Предпросмотр товаров</h4>
            {previewLoading ? (
              <div className={s.loader}>Загрузка...</div>
            ) : (
              <>
                <div className={s.previewStats}>
                  Найдено: <strong>{previewTotal}</strong>
                  {previewTotal < minItems && (
                    <span className={s.errorText}> (меньше минимума)</span>
                  )}
                  {previewTotal > maxItems && (
                    <span className={s.warningText}> (показано {maxItems} из {previewTotal})</span>
                  )}
                </div>
                <div className={s.productsGrid}>
                  {previewProducts.slice(0, 8).map(p => (
                    <div key={p.id} className={s.previewProduct}>
                      {p.images && p.images.length > 0 && (
                        <img src={p.images[0]} alt={p.name} />
                      )}
                      <div className={s.productName}>{p.name}</div>
                    </div>
                  ))}
                  {previewTotal > 8 && <div className={s.more}>+ ещё {previewTotal - 8}</div>}
                </div>
              </>
            )}
          </div>

          <div className={s.modalActions}>
            <Button text="Отмена" onClick={() => setShowModal(false)} />
            <Button text="Сохранить" onClick={handleSave} />
          </div>
        </div>

        {/* ПАНЕЛЬ ФИЛЬТРОВ ВНУТРИ МОДАЛКИ */}
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

export default PageBlocksManager