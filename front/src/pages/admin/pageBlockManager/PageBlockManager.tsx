// pages/admin/PageBlocks/PageBlocksManager.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Button from 'src/components/Button'
import Modal from 'src/components/modal/Modal'
import { useAppDispatch } from 'src/store/hooks/redux'
import { finishLoading } from 'src/store/reducers/loadingSlice'
import { Collection, PageWidget } from 'src/types/modules'
import s from './style.module.css'

// API функции
import {
  getPageWidgets,
  createPageWidget,
  updatePageWidget,
  deletePageWidget
} from 'src/providers/adminPageBlocksProvider'

import {
  getCollections,
  createCollection,
} from 'src/providers/adminCollectionProvider'

// Компоненты
import CollectionSelector from 'src/modules/admin/collectionSelector/CollectionSelector'
import CollectionForm from 'src/modules/admin/collectionForm/CollectionForm'

const PageBlocksManager: React.FC = () => {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(finishLoading());
    }, 0);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Список блоков
  const [blocks, setBlocks] = useState<PageWidget[]>([])
  const [loading, setLoading] = useState(true)
  
  // Список коллекций
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)

  // Модалки
  const [showModal, setShowModal] = useState(false)
  const [showCollectionSelector, setShowCollectionSelector] = useState(false)
  const [showCollectionForm, setShowCollectionForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<PageWidget | null>(null)

  // Форма
  const [blockName, setBlockName] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [blockType, setBlockType] = useState<'products_slider' | 'banner_slider' | 'brands_scroller'>('products_slider')
  const [isActive, setIsActive] = useState(true)

  // Состояния для CollectionSelector
  const [collectionsError, setCollectionsError] = useState<string | null>(null)

  // Загрузка всех блоков
  const loadBlocks = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPageWidgets()
      setBlocks(data)
    } catch (error) {
      console.error('Error loading blocks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Загрузка коллекций
  const loadCollections = useCallback(async () => {
    setCollectionsLoading(true)
    setCollectionsError(null)
    try {
      const data = await getCollections()
      setCollections(data)
    } catch (error) {
      console.error('Error loading collections:', error)
      setCollectionsError('Ошибка загрузки коллекций')
    } finally {
      setCollectionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBlocks()
    loadCollections()
  }, [loadBlocks, loadCollections])

  // Валидация
  const validateForm = (): boolean => {
    if (!blockName.trim()) {
      alert('Введите название блока')
      return false
    }

    if (!selectedCollection) {
      alert('Выберите коллекцию')
      return false
    }

    return true
  }

  // Сохранение
  const handleSave = async () => {
    if (!validateForm()) return

    const blockData = {
      name: blockName,
      type: blockType,
      sort_order: editingBlock?.sort_order ?? blocks.length,
      is_active: isActive,
      collection_id: selectedCollection?.id
    }

    try {
      if (editingBlock?.id) {
        await updatePageWidget(editingBlock.id, blockData)
      } else {
        await createPageWidget(blockData)
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
    setSelectedCollection(null)
    setBlockType('products_slider')
    setIsActive(true)
  }

  const openModal = (block?: PageWidget) => {
    if (block) {
      setEditingBlock(block)
      setBlockName(block.name)
      setBlockType(block.type || 'products_slider')
      setIsActive(block.is_active ?? true)
      
      // Находим коллекцию по ID
      const collection = collections.find(c => c.id === block.collection_id)
      setSelectedCollection(collection || null)
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить блок?')) return
    try {
      await deletePageWidget(id)
      await loadBlocks()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // ===== Сигналы для CollectionSelector =====
  
  // Выбор коллекции
  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setShowCollectionSelector(false)
  }

  // Закрытие CollectionSelector
  const handleCloseSelector = () => {
    setShowCollectionSelector(false)
  }

  // ===== Сигналы для CollectionForm =====
  
  // Открытие формы создания коллекции
  const handleOpenCreateCollection = () => {
    setShowCollectionSelector(false)
    setShowCollectionForm(true)
  }

  // Сохранение коллекции
  const handleSaveCollection = async (data: any) => {
    try {
      const newCollection = await createCollection(data)
      await loadCollections()
      setSelectedCollection(newCollection)
      setShowCollectionForm(false)
    } catch (error) {
      console.error('Error creating collection:', error)
      alert('Ошибка при создании коллекции')
    }
  }

  // Отмена создания коллекции
  const handleCancelCollection = () => {
    setShowCollectionForm(false)
  }

  // Получение названия коллекции для отображения
  const getCollectionDisplayName = useCallback((collectionId: number) => {
    const collection = collections.find(c => c.id === collectionId)
    return collection?.name || collection?.slug || 'Не выбрана'
  }, [collections])

  // Формируем текст сводки
  const getWidgetSummary = useMemo(() => {
    const parts: string[] = []
    
    if (selectedCollection) {
      parts.push(`Коллекция: ${selectedCollection.name}`)
    }

    const typeLabels = {
      'products_slider': 'Слайдер товаров',
      'banner_slider': 'Слайдер баннеров',
      'brands_scroller': 'Скроллер брендов'
    }
    parts.push(`Тип: ${typeLabels[blockType] || blockType}`)

    return parts.length > 0 ? parts.join('; ') : 'Не настроен'
  }, [selectedCollection, blockType])

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
                  <span className={s.typeTag}>{block.type}</span>
                  <span className={block.is_active ? s.active : s.inactive}>
                    {block.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </div>
                <div className={s.blockFilters}>
                  {block.collection_id ? (
                    <span className={s.filterTag}>
                      📁 Коллекция: {getCollectionDisplayName(block.collection_id)}
                    </span>
                  ) : (
                    <span className={s.emptyFilters}>Коллекция не выбрана</span>
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

      {/* Модалка редактирования блока */}
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
              className={s.input}
            />
          </div>

          <div className={s.formGroup}>
            <label>Тип блока *</label>
            <select 
              value={blockType} 
              onChange={e => setBlockType(e.target.value as any)}
              className={s.select}
            >
              <option value="products_slider">Слайдер товаров</option>
              <option value="banner_slider">Слайдер баннеров</option>
              <option value="brands_scroller">Скроллер брендов</option>
            </select>
          </div>

          <div className={s.formGroup}>
            <label>Коллекция *</label>
            <div 
              className={`${s.collectionSelector} ${!selectedCollection ? s.errorBorder : ''}`}
              onClick={() => setShowCollectionSelector(true)}
            >
              <div className={s.collectionDisplay}>
                {selectedCollection?.name || selectedCollection?.slug || 'Выберите коллекцию'}
              </div>
              <span className={s.editHint}>✏️ нажмите чтобы выбрать</span>
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

          <div className={s.previewSection}>
            <h4>Сводка</h4>
            <div className={s.summaryBox}>
              {getWidgetSummary}
            </div>
          </div>

          <div className={s.modalActions}>
            <Button text="Отмена" onClick={() => setShowModal(false)} />
            <Button text="Сохранить" onClick={handleSave} />
          </div>
        </div>

        {/* Модалка выбора коллекции */}
        {showCollectionSelector && (
          <div className={s.modalOverlay} onClick={() => setShowCollectionSelector(false)}>
            <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h3>Выберите коллекцию</h3>
                <button onClick={() => setShowCollectionSelector(false)}>✕</button>
              </div>
              
              <CollectionSelector
                collections={collections}
                loading={collectionsLoading}
                selectedId={selectedCollection?.id}
                onSelect={handleSelectCollection}
                onClose={handleCloseSelector}
              />
              
              <div className={s.modalFooter}>
                <Button text="+ Создать коллекцию" onClick={handleOpenCreateCollection} />
                <Button text="Закрыть" onClick={() => setShowCollectionSelector(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Модалка создания коллекции */}
        {showCollectionForm && (
          <div className={s.modalOverlay} onClick={() => setShowCollectionForm(false)}>
            <div className={s.modalPanel} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h3>Создать коллекцию</h3>
                <button onClick={() => setShowCollectionForm(false)}>✕</button>
              </div>
              
              <CollectionForm
                initialData={null}
                onSave={handleSaveCollection}
                onCancel={handleCancelCollection}
                onClose={() => setShowCollectionForm(false)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PageBlocksManager