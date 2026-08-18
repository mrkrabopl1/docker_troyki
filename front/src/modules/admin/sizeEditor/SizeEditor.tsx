// ============================================================
// 1. Компонент SizeEditorModal (чисто презентационный)
// ============================================================
// components/admin/SizeEditorModal/SizeEditorModal.tsx

import React, { useState } from 'react';
import Modal from 'src/components/modal/Modal';
import Button from 'src/components/Button';
import NumInput from 'src/components/input/NumInput';
import Input from 'src/components/input/Input';
import Checkbox from 'src/components/checkbox/Checkbox';
import s from './style.module.css';

export interface SizePrice {
    size: string;
    price: number;
    discount?: number;
    quantity?: number;
}

interface SizeEditorModalProps {
    isOpen: boolean;
    productId: number;
    productName: string;
    sizes: SizePrice[];
    loading?: boolean;
    saving?: boolean;
    onClose: () => void;
    onSave: (sizes: SizePrice[]) => void;  // сигнал на сохранение
    onUpdate?: () => void;                  // сигнал обновить список
}

export const SizeEditorModal: React.FC<SizeEditorModalProps> = ({
    isOpen,
    productId,
    productName,
    sizes: initialSizes,
    loading = false,
    saving = false,
    onClose,
    onSave,
    onUpdate
}) => {
    // Локальное состояние для редактирования
    const [sizes, setSizes] = useState<SizePrice[]>(initialSizes);
    const [hasChanges, setHasChanges] = useState(false);

    // Глобальные действия
    const [enableGlobalPrice, setEnableGlobalPrice] = useState(false);
    const [globalPriceMode, setGlobalPriceMode] = useState<'set' | 'add' | 'subtract'>('set');
    const [globalPriceValue, setGlobalPriceValue] = useState(0);
    const [enableGlobalQuantity, setEnableGlobalQuantity] = useState(false);
    const [globalQuantityMode, setGlobalQuantityMode] = useState<'set' | 'add' | 'subtract'>('set');
    const [globalQuantityValue, setGlobalQuantityValue] = useState(0);
    const [enableDiscountToAll, setEnableDiscountToAll] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);

    // Синхронизация при изменении пропсов
    React.useEffect(() => {
        setSizes(initialSizes);
        setHasChanges(false);
    }, [initialSizes]);

    const handleAddSize = () => {
        setSizes(prev => [...prev, { size: '', price: 0, discount: 0, quantity: 0 }]);
        setHasChanges(true);
    };

    const handleRemoveSize = (index: number) => {
        setSizes(prev => prev.filter((_, i) => i !== index));
        setHasChanges(true);
    };

    const handleSizeChange = (index: number, field: keyof SizePrice, value: string | number) => {
        setSizes(prev => prev.map((size, i) =>
            i === index ? { ...size, [field]: value } : size
        ));
        setHasChanges(true);
    };

    // Глобальные действия
    const applyGlobalPrice = () => {
        if (!enableGlobalPrice) return;
        setSizes(prev => prev.map(size => {
            let newPrice = size.price;
            if (globalPriceMode === 'set') newPrice = globalPriceValue;
            else if (globalPriceMode === 'add') newPrice = size.price + globalPriceValue;
            else if (globalPriceMode === 'subtract') newPrice = Math.max(0, size.price - globalPriceValue);
            return { ...size, price: newPrice };
        }));
        setHasChanges(true);
    };

    const applyGlobalQuantity = () => {
        if (!enableGlobalQuantity) return;
        setSizes(prev => prev.map(size => {
            let newQty = size.quantity || 0;
            if (globalQuantityMode === 'set') newQty = globalQuantityValue;
            else if (globalQuantityMode === 'add') newQty = newQty + globalQuantityValue;
            else if (globalQuantityMode === 'subtract') newQty = Math.max(0, newQty - globalQuantityValue);
            return { ...size, quantity: newQty };
        }));
        setHasChanges(true);
    };

    const applyGlobalDiscount = () => {
        if (!enableDiscountToAll) return;
        const percent = Math.min(100, Math.max(0, discountPercent));
        setSizes(prev => prev.map(size => ({
            ...size,
            discount: percent
        })));
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave(sizes); // сигнал наверх
        onUpdate?.(); // обновить список
        onClose();
    };

    return (
        <Modal active={isOpen} onChange={onClose}>
            <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                <div className={s.header}>
                    <h3>Размеры и остатки: {productName}</h3>
                    <button className={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                {loading ? (
                    <div className={s.loading}>Загрузка...</div>
                ) : (
                    <>
                        {/* Глобальные действия */}
                        <div className={s.bulkActions}>
                            <div className={s.bulkGroup}>
                                <Checkbox enable={true} activeData={enableDiscountToAll} onChange={setEnableDiscountToAll} />
                                <span className={s.bulkLabel}>Скидка (%)</span>
                                <NumInput
                                    disabled={!enableDiscountToAll}
                                    min={0}
                                    max={100}
                                    value={discountPercent}
                                    onChange={setDiscountPercent}
                                    className={s.smallInput}
                                />
                                <Button text="Применить" onClick={applyGlobalDiscount} disabled={!enableDiscountToAll} />
                            </div>

                            <div className={s.bulkGroup}>
                                <Checkbox enable={true} activeData={enableGlobalPrice} onChange={setEnableGlobalPrice} />
                                <span className={s.bulkLabel}>Цена</span>
                                <select
                                    value={globalPriceMode}
                                    onChange={(e) => setGlobalPriceMode(e.target.value as any)}
                                    disabled={!enableGlobalPrice}
                                    className={s.modeSelect}
                                >
                                    <option value="set">=</option>
                                    <option value="add">+</option>
                                    <option value="subtract">−</option>
                                </select>
                                <NumInput
                                    disabled={!enableGlobalPrice}
                                    min={0}
                                    value={globalPriceValue}
                                    onChange={setGlobalPriceValue}
                                    className={s.smallInput}
                                />
                                <Button text="Применить" onClick={applyGlobalPrice} disabled={!enableGlobalPrice} />
                            </div>

                            <div className={s.bulkGroup}>
                                <Checkbox enable={true} activeData={enableGlobalQuantity} onChange={setEnableGlobalQuantity} />
                                <span className={s.bulkLabel}>Кол-во</span>
                                <select
                                    value={globalQuantityMode}
                                    onChange={(e) => setGlobalQuantityMode(e.target.value as any)}
                                    disabled={!enableGlobalQuantity}
                                    className={s.modeSelect}
                                >
                                    <option value="set">=</option>
                                    <option value="add">+</option>
                                    <option value="subtract">−</option>
                                </select>
                                <NumInput
                                    disabled={!enableGlobalQuantity}
                                    min={0}
                                    value={globalQuantityValue}
                                    onChange={setGlobalQuantityValue}
                                    className={s.smallInput}
                                />
                                <Button text="Применить" onClick={applyGlobalQuantity} disabled={!enableGlobalQuantity} />
                            </div>

                            <Button className={s.addSizeBtn} text="+ Добавить размер" onClick={handleAddSize} />
                        </div>

                        {/* Таблица размеров */}
                        <div className={s.tableWrapper}>
                            <table className={s.sizesTable}>
                                <thead>
                                    <tr>
                                        <th>Размер</th>
                                        <th>Цена</th>
                                        <th>Скидка (%)</th>
                                        <th>Кол-во</th>
                                        <th>Наличие</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sizes.map((size, idx) => {
                                        const inStock = (size.quantity || 0) > 0;
                                        return (
                                            <tr key={idx} className={inStock ? s.inStock : s.outOfStock}>
                                                <td data-label="Размер">
                                                    <Input
                                                        value={size.size}
                                                        onChange={(val) => handleSizeChange(idx, 'size', val)}
                                                        className={!size.size.trim() ? s.errorInput : ''}
                                                    />
                                                </td>
                                                <td data-label="Цена">
                                                    <NumInput
                                                        min={0}
                                                        value={size.price}
                                                        onChange={(val) => handleSizeChange(idx, 'price', val)}
                                                        disabled={enableGlobalPrice}
                                                    />
                                                </td>
                                                <td data-label="Скидка (%)">
                                                    <NumInput
                                                        min={0}
                                                        max={100}
                                                        value={enableDiscountToAll ? discountPercent : size.discount}
                                                        onChange={(val) => handleSizeChange(idx, 'discount', val)}
                                                        disabled={enableDiscountToAll}
                                                    />
                                                </td>
                                                <td data-label="Кол-во">
                                                    <NumInput
                                                        min={0}
                                                        value={size.quantity}
                                                        onChange={(val) => handleSizeChange(idx, 'quantity', val)}
                                                        disabled={enableGlobalQuantity}
                                                    />
                                                </td>
                                                <td data-label="Наличие">
                                                    <span className={inStock ? s.inStockBadge : s.outOfStockBadge}>
                                                        {inStock ? '✓ В наличии' : '✕ Нет'}
                                                    </span>
                                                </td>
                                                <td data-label="">
                                                    <button className={s.removeBtn} onClick={() => handleRemoveSize(idx)}>
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {sizes.length === 0 && (
                                <div className={s.emptySizes}>Нет размеров. Используйте кнопку «+ Добавить размер»</div>
                            )}
                        </div>

                        <div className={s.footer}>
                            <Button
                                text={saving ? 'Сохранение...' : 'Сохранить'}
                                onClick={handleSave}
                                disabled={saving || !hasChanges}
                            />
                            <Button text="Отмена" onClick={onClose} className={s.cancelBtn} />
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

