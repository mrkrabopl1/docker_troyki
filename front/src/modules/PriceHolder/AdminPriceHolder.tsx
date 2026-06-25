// modules/PriceHolder/PriceHolder.tsx (обновленная версия)
import React, { useState, useCallback, useMemo } from 'react';
import s from './style.module.css';

interface PriceHolderProps {
  elems: Record<string, { price: number; discount?: number; size: string }>;
  onChange: (data: Record<string, any>) => void;
  editable?: boolean;
  productType?: string;
  className?: string;
}

const AdminPriceHolder: React.FC<PriceHolderProps> = ({
  elems = {},
  onChange,
  editable = false,
  productType = 'snickers',
  className = ''
}) => {
  const [localData, setLocalData] = useState(elems);
  const [newSize, setNewSize] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const sizes = useMemo(() => {
    if (productType === 'snickers') {
      return ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
    } else if (productType === 'clothes') {
      return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    }
    return ['ONE SIZE'];
  }, [productType]);

  const handlePriceChange = useCallback((size: string, price: number) => {
    const updated = {
      ...localData,
      [size]: {
        ...localData[size],
        price,
        size
      }
    };
    setLocalData(updated);
    onChange(updated);
  }, [localData, onChange]);

  const handleDiscountChange = useCallback((size: string, discount: number) => {
    const updated = {
      ...localData,
      [size]: {
        ...localData[size],
        discount
      }
    };
    setLocalData(updated);
    onChange(updated);
  }, [localData, onChange]);

  const addNewSize = useCallback(() => {
    if (!newSize || !newPrice) return;
    
    const updated = {
      ...localData,
      [newSize]: {
        price: Number(newPrice),
        size: newSize,
        discount: 0
      }
    };
    
    setLocalData(updated);
    onChange(updated);
    setNewSize('');
    setNewPrice('');
  }, [newSize, newPrice, localData, onChange]);

  const removeSize = useCallback((size: string) => {
    const { [size]: removed, ...rest } = localData;
    setLocalData(rest);
    onChange(rest);
  }, [localData, onChange]);

  return (
    <div className={`${s.container} ${className}`}>
      <div className={s.sizeList}>
        {Object.entries(localData).map(([size, data]) => (
          <div key={size} className={s.sizeItem}>
            <span className={s.sizeLabel}>{size}</span>
            
            {editable ? (
              <>
                <input
                  type="number"
                  value={data.price}
                  onChange={(e) => handlePriceChange(size, Number(e.target.value))}
                  className={s.priceInput}
                  placeholder="Цена"
                />
                <input
                  type="number"
                  value={data.discount || ''}
                  onChange={(e) => handleDiscountChange(size, Number(e.target.value))}
                  className={s.discountInput}
                  placeholder="Скидка"
                />
                <button
                  type="button"
                  onClick={() => removeSize(size)}
                  className={s.removeButton}
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span className={s.price}>
                  {data.discount ? (
                    <>
                      <span className={s.oldPrice}>{data.price} ₽</span>
                      <span className={s.currentPrice}>{data.price - data.discount} ₽</span>
                    </>
                  ) : (
                    <span>{data.price} ₽</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={(size) => onChange(size)}
                  className={s.selectButton}
                >
                  Выбрать
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <div className={s.addSizeForm}>
          <select
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            className={s.sizeSelect}
          >
            <option value="">Выберите размер</option>
            {sizes.filter(s => !localData[s]).map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className={s.newPriceInput}
            placeholder="Цена"
          />
          
          <button
            type="button"
            onClick={addNewSize}
            disabled={!newSize || !newPrice}
            className={s.addButton}
          >
            Добавить
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPriceHolder;