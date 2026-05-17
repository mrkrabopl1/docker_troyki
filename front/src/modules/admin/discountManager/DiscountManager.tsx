// src/modules/admin/DiscountManager/DiscountManager.tsx
import React, { useState, useEffect } from 'react';
import Button from 'src/components/Button';
import {
    getEntityDiscounts,
    getDiscountRules,
    createDiscountRule,
    updateDiscountRule,
    addRuleItems,
    removeRuleItem,
    deleteDiscountRule,
    toggleDiscountRule
} from 'src/providers/adminProvider';
import s from './style.module.css';

interface DiscountManagerProps {
    entityType: 'brand' | 'line' | 'product';
    entityId: number;
    entityName: string;
    onClose: () => void;
}

interface DiscountRule {
    id: number;
    name: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    priority: number;
}

const DiscountManager: React.FC<DiscountManagerProps> = ({
    entityType,
    entityId,
    entityName,
    onClose
}) => {
    const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
    const [allRules, setAllRules] = useState<DiscountRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAddExisting, setShowAddExisting] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
    const [editingRule, setEditingRule] = useState<DiscountRule | null>(null); // <-- для редактирования

    const initialForm = {
        name: '',
        discount_type: 'percentage' as 'percentage' | 'fixed_amount',
        discount_value: 0,
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: ''
    };
    const [form, setForm] = useState(initialForm);

    const loadDiscounts = async () => {
        setLoading(true);
        try {
            const [entityData, allData] = await Promise.all([
                getEntityDiscounts(entityType, entityId),
                getDiscountRules(1, 100)
            ]);
            setDiscounts(entityData.rules || []);
            setAllRules(allData.rules || []);
        } catch (error) {
            console.error('Error loading discounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDiscounts();
    }, []);

    // Правила, которые ещё не применены к сущности
    const availableRules = allRules.filter(
        rule => !discounts.find(d => d.id === rule.id)
    );

    // ============ Редактирование ============
    const startEdit = (rule: DiscountRule) => {
        setEditingRule(rule);
        setForm({
            name: rule.name,
            discount_type: rule.discount_type,
            discount_value: rule.discount_value,
            starts_at: rule.starts_at?.split('T')[0] || initialForm.starts_at,
            ends_at: rule.ends_at ? rule.ends_at.split('T')[0] : ''
        });
        setShowForm(false);
        setShowAddExisting(false);
    };

    const cancelEdit = () => {
        setEditingRule(null);
        setForm(initialForm);
    };

    // ============ Сохранение (создание или обновление) ============
    const handleSave = async () => {
        if (form.discount_value <= 0) return;

        setFormLoading(true);
        try {
            if (editingRule) {
                // Обновление существующего правила
                await updateDiscountRule(editingRule.id, {
                    name: form.name,
                    discount_type: form.discount_type,
                    discount_value: form.discount_value,
                    starts_at: form.starts_at,
                    ends_at: form.ends_at || undefined
                });
                cancelEdit();
            } else {
                // Создание нового правила
                await createDiscountRule({
                    name: form.name || `${entityType === 'brand' ? 'Бренд' : 'Линейка'}: ${entityName}`,
                    discount_type: form.discount_type,
                    discount_value: form.discount_value,
                    starts_at: form.starts_at,
                    ends_at: form.ends_at || undefined,
                    priority: 0,
                    items: [{ item_type: entityType, item_id: entityId }]
                });
                setShowForm(false);
            }

            setForm(initialForm);
            await loadDiscounts();
        } catch (error) {
            console.error('Error saving discount:', error);
            alert('Ошибка при сохранении скидки');
        } finally {
            setFormLoading(false);
        }
    };

    // ============ Добавление в существующее правило ============
    const handleAddToExisting = async () => {
        if (!selectedRuleId) return;

        setFormLoading(true);
        try {
            await addRuleItems(selectedRuleId, [{
                item_type: entityType,
                item_id: entityId
            }]);
            setShowAddExisting(false);
            setSelectedRuleId(null);
            await loadDiscounts();
        } catch (error) {
            console.error('Error adding to rule:', error);
            alert('Ошибка при добавлении в правило');
        } finally {
            setFormLoading(false);
        }
    };

    // ============ Удаление из правила (но само правило остаётся) ============
    const handleRemoveFromRule = async (ruleId: number) => {
        if (!confirm('Убрать из этого правила? Само правило не удалится.')) return;
        try {
            await removeRuleItem(ruleId, entityType, entityId);
            await loadDiscounts();
        } catch (error) {
            console.error('Error removing from rule:', error);
        }
    };

    // ============ Удаление правила целиком ============
    const handleDelete = async (ruleId: number) => {
        if (!confirm('Удалить правило полностью? Оно удалится для всех.')) return;
        try {
            await deleteDiscountRule(ruleId);
            await loadDiscounts();
        } catch (error) {
            console.error('Error deleting discount:', error);
        }
    };

    // ============ Переключение активности ============
    const handleToggle = async (ruleId: number) => {
        try {
            await toggleDiscountRule(ruleId);
            await loadDiscounts();
        } catch (error) {
            console.error('Error toggling discount:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    // ============ UI ============
    return (
        <div className={s.container}>
            <div className={s.header}>
                <h3>
                    Скидки: {entityName}
                    <span className={s.entityType}>
                        ({entityType === 'brand' ? 'Бренд' : 'Линейка'})
                    </span>
                </h3>
                <button className={s.closeBtn} onClick={onClose}>✕</button>
            </div>

            <div className={s.actions}>
                <Button
                    text="+ Новая скидка"
                    onClick={() => {
                        cancelEdit();
                        setShowForm(true);
                        setShowAddExisting(false);
                    }}
                />
                <Button
                    text="+ Добавить в существующую"
                    onClick={() => {
                        cancelEdit();
                        setShowAddExisting(true);
                        setShowForm(false);
                    }}
                />
            </div>

            {/* Форма создания / редактирования */}
            {(showForm || editingRule) && (
                <div className={s.form}>
                    <h4>{editingRule ? 'Редактирование правила' : 'Новая скидка'}</h4>
                    <div className={s.formRow}>
                        <label>Название:</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder={`Скидка на ${entityName}`}
                        />
                    </div>
                    <div className={s.formRow}>
                        <label>Тип:</label>
                        <select
                            value={form.discount_type}
                            onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                        >
                            <option value="percentage">Процент (%)</option>
                            <option value="fixed_amount">Фикс. сумма (₽)</option>
                        </select>
                    </div>
                    <div className={s.formRow}>
                        <label>Значение:</label>
                        <input
                            type="number"
                            value={form.discount_value}
                            onChange={e => setForm({ ...form, discount_value: +e.target.value })}
                            min={0}
                        />
                        <span className={s.suffix}>{form.discount_type === 'percentage' ? '%' : '₽'}</span>
                    </div>
                    <div className={s.formRow}>
                        <label>Начало:</label>
                        <input
                            type="date"
                            value={form.starts_at}
                            onChange={e => setForm({ ...form, starts_at: e.target.value })}
                        />
                    </div>
                    <div className={s.formRow}>
                        <label>Конец:</label>
                        <input
                            type="date"
                            value={form.ends_at}
                            onChange={e => setForm({ ...form, ends_at: e.target.value })}
                        />
                        <span className={s.hint}>(пусто — бессрочно)</span>
                    </div>
                    <div className={s.formActions}>
                        <Button
                            text={editingRule ? 'Сохранить изменения' : 'Создать'}
                            onClick={handleSave}
                            disabled={formLoading}
                        />
                        <Button
                            text="Отмена"
                            onClick={() => {
                                if (editingRule) cancelEdit();
                                else setShowForm(false);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Форма добавления в существующее правило */}
            {showAddExisting && (
                <div className={s.form}>
                    <h4>Добавить в существующее правило</h4>
                    {availableRules.length > 0 ? (
                        <>
                            <div className={s.formRow}>
                                <label>Правило:</label>
                                <select
                                    value={selectedRuleId || ''}
                                    onChange={e => setSelectedRuleId(Number(e.target.value) || null)}
                                >
                                    <option value="">Выберите правило</option>
                                    {availableRules.map(rule => (
                                        <option key={rule.id} value={rule.id}>
                                            {rule.name} ({rule.discount_type === 'percentage'
                                                ? `-${rule.discount_value}%`
                                                : `-${rule.discount_value}₽`})
                                            {rule.ends_at ? ` до ${formatDate(rule.ends_at)}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={s.formActions}>
                                <Button
                                    text="Добавить"
                                    onClick={handleAddToExisting}
                                    disabled={!selectedRuleId || formLoading}
                                />
                                <Button text="Отмена" onClick={() => { setShowAddExisting(false); setSelectedRuleId(null); }} />
                            </div>
                        </>
                    ) : (
                        <div className={s.empty}>
                            Нет доступных правил.<br/>
                            Все существующие правила уже применены к этой сущности.
                        </div>
                    )}
                </div>
            )}

            {/* Список применённых скидок */}
            <div className={s.list}>
                {loading ? (
                    <div className={s.loading}>Загрузка...</div>
                ) : discounts.length === 0 ? (
                    <div className={s.empty}>Нет активных скидок</div>
                ) : (
                    discounts.map(discount => (
                        <div
                            key={discount.id}
                            className={`${s.discountRow} ${!discount.is_active ? s.inactive : ''}`}
                        >
                            <div className={s.discountInfo}>
                                <div className={s.discountName}>{discount.name}</div>
                                <div className={s.discountMeta}>
                                    {formatDate(discount.starts_at)}
                                    {discount.ends_at
                                        ? ` — ${formatDate(discount.ends_at)}`
                                        : ' — бессрочно'}
                                </div>
                            </div>
                            <div className={s.discountValue}>
                                {discount.discount_type === 'percentage'
                                    ? `-${discount.discount_value}%`
                                    : `-${discount.discount_value}₽`}
                            </div>
                            <div className={s.discountActions}>
                                {/* Кнопка редактирования */}
                                <button
                                    className={s.editBtn}
                                    onClick={() => startEdit(discount)}
                                    title="Редактировать правило"
                                >
                                    ✎
                                </button>
                                <button
                                    className={`${s.toggleBtn} ${discount.is_active ? s.active : ''}`}
                                    onClick={() => handleToggle(discount.id)}
                                    title={discount.is_active ? 'Деактивировать' : 'Активировать'}
                                >
                                    {discount.is_active ? 'ON' : 'OFF'}
                                </button>
                                <button
                                    className={s.removeBtn}
                                    onClick={() => handleRemoveFromRule(discount.id)}
                                    title="Убрать из правила"
                                >
                                    ↩
                                </button>
                                <button
                                    className={s.deleteBtn}
                                    onClick={() => handleDelete(discount.id)}
                                    title="Удалить правило полностью"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DiscountManager;