// pages/admin/PageBlocks/PageBlocksManager.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Button from 'src/components/Button'
import Modal from 'src/components/modal/Modal'
import ProductsFilters from 'src/modules/settingsPanels/ProductsFilters'
import { useAppSelector } from 'src/store/hooks/redux'
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
import s from './style.module.css'

const PageBlocksManager: React.FC = () => {
  const router = useRouter()
  const { typesVal, firmMap } = useAppSelector(state => state.menuReducer)

  // Список блоков
  const [blocks, setBlocks] = useState<PageBlock[]>([])
  const [loading, setLoading] = useState(true)

  // Модалка редактирования
  const [showModal, setShowModal] = useState(false)
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null)
  const [blockFilters, setBlockFilters] = useState<PageBlock['filters']>({
    sizes: [],
    firms: [],
    types: [],
    price: [0, 100000],
    discount: 1,
    in_store:false
  })
  const [blockName, setBlockName] = useState('')
  const [minItems, setMinItems] = useState(6)
  const [maxItems, setMaxItems] = useState(20)
  const [isActive, setIsActive] = useState(true)

  // Предпросмотр товаров
  const [previewProducts, setPreviewProducts] = useState<any[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Состояния фильтров для ProductsFilters
  const [filtersState, setFiltersState] = useState<any>({
    priceProps: { min: 0, max: 100000 },
    checboxsProps: [],
    soloDataProps: [],
    timeProps: []
  })
  const activeSizes = useRef<string[]>([])
  const firms = useRef<string[]>([])
  const typesIds = useRef<number[]>([])

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

  // Преобразование фильтров для компонента ProductsFilters
  const convertFiltersData = useCallback((resData: any, currentFilters: PageBlock['filters']) => {
    const priceProps = {
      min: resData.price?.[0] || 0,
      max: resData.price?.[1] || 100000,
    }

    activeSizes.current = resData.sizes ? Object.keys(resData.sizes) : []
    firms.current = resData.firmsCount ? Object.keys(resData.firmsCount) : []
    typesIds.current = resData.types || []

    const checkBoxPropsData = activeSizes.current.map(size => ({
      enable: true,
      activeData: currentFilters.sizes?.includes(size) || false,
      name: size
    }))

    const checkBoxPropsTypeData = typesIds.current.map(typeId => ({
      enable: true,
      activeData: currentFilters.types?.includes(typeId) || false,
      name: typesVal[typeId]?.name || '',
      id: typeId
    }))

    const checkBoxPropsFirmData = firms.current.map(firm => ({
      enable: true,
      activeData: currentFilters.firms?.includes(firmMap[firm]) || false,
      name: firm
    }))

    setFiltersState({
      priceProps,
      checboxsProps: [
        { id: "sizes", name: "Размеры", props: checkBoxPropsData },
        { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
        { id: "type", name: "Типы товара", props: checkBoxPropsTypeData }
      ],
      soloDataProps: [
        { name: "На витрине", activeData: currentFilters.in_store === true, enable: true },
        { name: "Со скидкой", activeData: currentFilters.discount || false, enable: true }
      ]
    })
  }, [typesVal, firmMap])

  // Загрузка доступных фильтров (опций) для предпросмотра
  const loadFilterOptions = useCallback(async () => {
    try {
      await getAdminProductsAndFilters(
        (data: any) => {
          if (data.filters) convertFiltersData(data.filters, blockFilters)
        },
        1,
        1,
        0
      )
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }, [convertFiltersData, blockFilters])

  // Обновление предпросмотра товаров по текущим фильтрам
  const updatePreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      // Используем существующий API для получения товаров с фильтрами
      const params = {
        sizes: blockFilters.sizes,
        firms: blockFilters.firms,
        types: blockFilters.types,
        price: blockFilters.price,
        discount: blockFilters.discount,
        is_active: undefined, // предпросмотр показывает все активные товары
      }
      // Запрашиваем до maxItems товаров, чтобы показать, сколько будет
      await getAdminProducts(
        (data: any) => {
          setPreviewProducts(data.products.slice(0, maxItems))
          setPreviewTotal(data.totalCount)
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
  }, [blockFilters, maxItems])

  // Обработчик изменения фильтров из ProductsFilters
  const handleFiltersChange = useCallback((filter: any) => {
    setBlockFilters(prev => {
      const newFilters = { ...prev }
      switch (filter.id) {
        case "sizes":
          newFilters.sizes = filter.data
            .map((active: boolean, idx: number) => active ? activeSizes.current[idx] : null)
            .filter(Boolean) as string[]
          break
        case "firms":
          newFilters.firms = filter.data
            .map((active: boolean, idx: number) => active ? firmMap[firms.current[idx]] : null)
            .filter(Boolean) as number[]
          break
        case "type":
          newFilters.types = filter.data
            .map((active: boolean, idx: number) => active ? typesIds.current[idx] : null)
            .filter(Boolean) as number[]
          break
        case "price":
          newFilters.price = filter.data
          break
        case "solo":
          // индекс 0 – на витрине, 1 – скрытые, 2 – со скидкой
          // для предпросмотра блоков не используем статус видимости, только discount
          newFilters.discount = filter.data[2] || false
          break
      }
      return newFilters
    })
  }, [firmMap])

  // Дебаунс для обновления предпросмотра при изменении фильтров
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showModal) updatePreview()
    }, 500)
    return () => clearTimeout(timer)
  }, [blockFilters, maxItems, showModal, updatePreview])

  // Загрузка опций фильтров при открытии модалки
  useEffect(() => {
    if (showModal) {
      loadFilterOptions()
    }
  }, [showModal, loadFilterOptions])

  // Валидация: количество товаров должно быть между minItems и maxItems
  const isValid = useMemo(() => {
    return previewTotal >= minItems && previewTotal <= maxItems && blockName.trim() !== ''
  }, [previewTotal, minItems, maxItems, blockName])

  // Сохранение блока
  const handleSave = async () => {
    if (!isValid) return
    const blockData: Omit<PageBlock, 'id'> = {
      name: blockName,
      sort_order: editingBlock?.sort_order ?? blocks.length,
      is_active: isActive,
      filters: blockFilters,
      min_items: minItems,
      max_items: maxItems
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
    }
  }

  const resetForm = () => {
    setEditingBlock(null)
    setBlockName('')
    setBlockFilters({
      sizes: [],
      firms: [],
      types: [],
      price: [0, 100000],
      discount: -1,
      in_store:false
    })
    setMinItems(6)
    setMaxItems(20)
    setIsActive(true)
    setPreviewProducts([])
    setPreviewTotal(0)
  }

  const openModal = (block?: PageBlock) => {
    if (block) {
      setEditingBlock(block)
      setBlockName(block.name)
      setBlockFilters(block.filters)
      setMinItems(block.min_items)
      setMaxItems(block.max_items)
      setIsActive(block.is_active)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить блок?')) return
    await deletePageBlock(id)
    await loadBlocks()
  }

  // Сортировка (drag-and-drop можно добавить позже)
  const handleReorder = async (dragIndex: number, dropIndex: number) => {
    const newBlocks = [...blocks]
    const [removed] = newBlocks.splice(dragIndex, 1)
    newBlocks.splice(dropIndex, 0, removed)
    const orderedIds = newBlocks.map(b => b.id!)
    await reorderPageBlocks(orderedIds)
    await loadBlocks()
  }

  // Рендер
  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Управление блоками главной страницы</h2>
        <Button text="+ Добавить блок" onClick={() => openModal()} />
      </div>

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className={s.blocksList}>
          {blocks.map((block, idx) => (
            <div key={block.id} className={s.blockCard}>
              <div className={s.blockHeader}>
                <strong>{block.name}</strong>
                <span className={s.sortHandle} onClick={() => {/* реализовать перетаскивание */}}>⋮⋮</span>
              </div>
              <div className={s.blockInfo}>
                <span>Порядок: {block.sort_order}</span>
                <span>Товаров: от {block.min_items} до {block.max_items}</span>
                <span className={block.is_active ? s.active : s.inactive}>
                  {block.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <div className={s.blockActions}>
                <button onClick={() => openModal(block)}>✏️ Редактировать</button>
                <button onClick={() => handleDelete(block.id!)}>🗑️ Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal active={showModal} onChange={setShowModal}>
        <div className={s.modalContent} style={{ width: '90vw', maxWidth: 1200 }}>
          <div className={s.modalHeader}>
            <h3>{editingBlock ? 'Редактировать блок' : 'Новый блок'}</h3>
            <button onClick={() => setShowModal(false)}>✕</button>
          </div>

          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label>Название блока *</label>
              <input
                type="text"
                value={blockName}
                onChange={e => setBlockName(e.target.value)}
                placeholder="Новинки, Хиты продаж..."
              />
            </div>
            <div className={s.formGroup}>
              <label>Активность</label>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            </div>
          </div>

          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label>Мин. количество товаров (6–20) *</label>
              <input
                type="number"
                min={6}
                max={20}
                value={minItems}
                onChange={e => setMinItems(Number(e.target.value))}
              />
            </div>
            <div className={s.formGroup}>
              <label>Макс. количество товаров (6–20) *</label>
              <input
                type="number"
                min={6}
                max={20}
                value={maxItems}
                onChange={e => setMaxItems(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={s.filtersSection}>
            <label>Условия показа товаров</label>
            <ProductsFilters
              memo
              onChange={handleFiltersChange}
              {...filtersState}
            />
          </div>

          <div className={s.previewSection}>
            <h4>Предпросмотр товаров по фильтрам</h4>
            {previewLoading ? (
              <div>Загрузка товаров...</div>
            ) : (
              <>
                <div className={s.previewStats}>
                  Найдено товаров: <strong>{previewTotal}</strong>
                  {previewTotal < minItems && (
                    <span className={s.error}> (меньше минимума – блок не будет показан)</span>
                  )}
                  {previewTotal > maxItems && (
                    <span className={s.warning}> (больше максимума – будет показано только {maxItems})</span>
                  )}
                </div>
                <div className={s.productsGrid}>
                  {previewProducts.slice(0, 8).map(p => (
                    <div key={p.id} className={s.previewProduct}>
                      <img src={p.image_path} alt={p.name} />
                      <div>{p.name}</div>
                    </div>
                  ))}
                  {previewTotal > 8 && <div className={s.more}>+ ещё {previewTotal - 8}</div>}
                </div>
              </>
            )}
          </div>

          <div className={s.modalActions}>
            <Button text="Отмена" onClick={() => setShowModal(false)} />
            <Button
              text="Сохранить"
              onClick={handleSave}
              disabled={!isValid}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PageBlocksManager