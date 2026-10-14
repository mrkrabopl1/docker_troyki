import React, { useCallback, useEffect, useState } from 'react';
import {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    type Address,
    type AddressInput,
} from 'src/providers/userProvider';
import AddressForm from 'src/modules/sendForm/AddressForm';
import s from './addressSelector.module.css';

interface AddressSelectorProps {
    /** Текущий выбранный адрес (для radio) */
    selectedId: number | null;
    /** Когда юзер выбрал адрес */
    onSelect: (address: Address) => void;
    /** Когда юзер добавил/изменил/удалил адрес — обновить список */
    onAddressesChange?: (addresses: Address[]) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
    selectedId,
    onSelect,
    onAddressesChange,
}) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Address | null | undefined>(undefined);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAddresses();
        setAddresses(data);
        setLoading(false);
        onAddressesChange?.(data);
    }, [onAddressesChange]);

    useEffect(() => {
        load();
    }, [load]);

    // Автовыбор дефолтного адреса, если ничего не выбрано
    useEffect(() => {
        if (selectedId || !addresses.length) return;
        const def = addresses.find(a => a.is_default) || addresses[0];
        if (def) onSelect(def);
    }, [addresses, selectedId, onSelect]);

    const handleSave = useCallback(async (data: AddressInput) => {
        if (editing?.id) {
            await updateAddress(editing.id, data);
        } else {
            const created = await createAddress(data);
            // Сразу выбираем созданный
            onSelect(created);
        }
        setEditing(undefined);
        await load();
    }, [editing, load, onSelect]);

    const handleDelete = useCallback(async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Удалить адрес?')) return;
        await deleteAddress(id);
        await load();
    }, [load]);

    const handleSetDefault = useCallback(async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        await setDefaultAddress(id);
        await load();
    }, [load]);

    if (editing !== undefined) {
        return (
            <AddressForm
                valid={true}
                address={editing}
                onSaved={handleSave}
                onCancel={() => setEditing(undefined)}
            />
        );
    }

    if (loading) {
        return <div className={s.loading}>Загрузка адресов...</div>;
    }

    return (
        <div className={s.wrapper}>
            <div className={s.list}>
                {addresses.map(addr => (
                    <label
                        key={addr.id}
                        className={`${s.item} ${selectedId === addr.id ? s.itemActive : ''}`}
                    >
                        <input
                            type="radio"
                            name="address"
                            checked={selectedId === addr.id}
                            onChange={() => onSelect(addr)}
                            className={s.radio}
                        />
                        <div className={s.itemBody}>
                            <div className={s.itemAddress}>
                                {addr.town}
                                {addr.street && `, ${addr.street}`}
                                {addr.house && `, д. ${addr.house}`}
                                {addr.flat && `, кв. ${addr.flat}`}
                            </div>
                            {(addr.index || addr.region) && (
                                <div className={s.itemMeta}>
                                    {addr.region && <span>{addr.region}</span>}
                                    {addr.index && <span>Индекс: {addr.index}</span>}
                                </div>
                            )}
                            {addr.is_default && (
                                <div className={s.defaultBadge}>Основной</div>
                            )}
                        </div>
                        <div className={s.actions}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing(addr);
                                }}
                                className={s.actionBtn}
                            >
                                Изменить
                            </button>
                            {!addr.is_default && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSetDefault(addr.id, e)}
                                    className={s.actionBtn}
                                >
                                    Основной
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => handleDelete(addr.id, e)}
                                className={`${s.actionBtn} ${s.deleteBtn}`}
                            >
                                Удалить
                            </button>
                        </div>
                    </label>
                ))}
            </div>

            <button
                type="button"
                className={s.addBtn}
                onClick={() => setEditing(null)}
            >
                + Добавить новый адрес
            </button>
        </div>
    );
};

export default AddressSelector;