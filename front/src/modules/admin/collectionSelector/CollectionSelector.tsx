// modules/admin/collectionSelector/CollectionSelector.tsx
import React, { useState, useEffect } from 'react'
import { Collection } from 'src/types/modules'
import s from './style.module.css'

interface CollectionSelectorProps {
  collections: Collection[];
  loading: boolean;
  selectedId?: number;
  onSelect: (collection: Collection) => void;
  onClose: () => void;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  collections,
  loading,
  selectedId,
  onSelect,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className={s.loader}>Загрузка коллекций...</div>
  }

  return (
    <div className={s.container}>
      <div className={s.searchBox}>
        <input
          type="text"
          placeholder="Поиск коллекции..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={s.searchInput}
        />
      </div>

      <div className={s.collectionsList}>
        {filteredCollections.length === 0 ? (
          <div className={s.emptyState}>
            {searchTerm ? 'Коллекции не найдены' : 'Нет доступных коллекций'}
          </div>
        ) : (
          filteredCollections.map(collection => (
            <div
              key={collection.id}
              className={`${s.collectionItem} ${selectedId === collection.id ? s.selected : ''}`}
              onClick={() => {
                onSelect(collection)
                onClose()
              }}
            >
              <div className={s.collectionName}>{collection.name}</div>
              <div className={s.collectionSlug}>slug: {collection.slug}</div>
              {collection.product_count !== undefined && (
                <div className={s.collectionCount}>Товаров: {collection.product_count}</div>
              )}
              <div className={s.collectionType}>
                Тип: {collection.type === 'dynamic' ? 'Динамическая' : 
                       collection.type === 'manual' ? 'Ручная' : 'Гибридная'}
              </div>
            </div>
          ))
        )}
      </div>

      <div className={s.actions}>
        <button className={s.btnSecondary} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default CollectionSelector