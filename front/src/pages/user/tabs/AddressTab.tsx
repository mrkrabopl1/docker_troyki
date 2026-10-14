import React, { useEffect, useState, useCallback, memo } from 'react';
import AddressForm from 'src/modules/sendForm/AddressForm';
import {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    type Address,
} from 'src/providers/userProvider';
import s from './style.module.css';

const AddressTab: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    // null = форма закрыта, {} = создание, {id: 5} = редактирование
    const [editing, setEditing] = useState<Address | null | undefined>(undefined);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAddresses();
            setAddresses(data);
        } catch (err) {
            console.warn('[AddressTab] load failed:', err);
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = useCallback(() => {
        setEditing(null); // null означает "создание"
    }, []);

    const handleEdit = useCallback((addr: Address) => {
        setEditing(addr);
    }, []);

    const handleCancel = useCallback(() => {
        setEditing(undefined);
    }, []);

    const handleSave = useCallback(async (data: Address) => {
        try {
            if (editing && (editing as Address).id) {
                await updateAddress((editing as Address).id, data);
            } else {
                await createAddress(data);
            }
            setEditing(undefined);
            await load();
        } catch (err) {
            console.warn('[AddressTab] save failed:', err);
        }
    }, [editing, load]);

    const handleDelete = useCallback(async (id: number) => {
        if (!confirm('Удалить адрес?')) return;
        try {
            await deleteAddress(id);
            await load();
        } catch (err) {
            console.warn('[AddressTab] delete failed:', err);
        }
    }, [load]);

    const handleSetDefault = useCallback(async (id: number) => {
        try {
            await setDefaultAddress(id);
            await load();
        } catch (err) {
            console.warn('[AddressTab] set default failed:', err);
        }
    }, [load]);

    // Форма открыта
    if (editing !== undefined) {
        return (
            <AddressForm
                valid={true}
                address={editing}
                onSaved={handleSave}
                onCancel={handleCancel}
            />
        );
    }

    // Загрузка
    if (loading) {
        return <div className={s.loading}>Загрузка адресов...</div>;
    }

    // Список адресов
    return (
        <div className={s.wrapper}>
            {addresses.length === 0 ? (
                <div className={s.empty}>У вас пока нет сохранённых адресов</div>
            ) : (
                <div className={s.list}>
                    {addresses.map((addr) => (
                        <div
                            key={addr.id}
                            className={`${s.item} ${addr.is_default ? s.itemDefault : ''}`}
                        >
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

                            <div className={s.itemActions}>
                                <button onClick={() => handleEdit(addr)}>Изменить</button>
                                {!addr.is_default && (
                                    <button onClick={() => handleSetDefault(addr.id)}>
                                        Сделать основным
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(addr.id)}
                                    className={s.deleteBtn}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className={s.addBtn} onClick={handleCreate}>
                + Добавить адрес
            </button>
        </div>
    );
};

export default memo(AddressTab);