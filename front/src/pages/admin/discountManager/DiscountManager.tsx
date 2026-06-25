// src/modules/admin/DiscountRulesManager/DiscountRulesManager.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    getDiscountRules,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
    toggleDiscountRule,
    getDiscountRule,
} from 'src/providers/adminProvider';
import DatePicker from 'src/components/input/DatePicker';
import Button from 'src/components/Button';
import s from './style.module.css';
import { useAppDispatch, useAppSelector, useMediaQuery } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice';

interface DiscountRule {
    id: number;
    name: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

interface RuleItem {
    id: number;
    item_type: 'brand' | 'line' | 'product';
    item_id: number;
    item_name?: string;
}

const DiscountRulesManager: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.adminReducer);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [rules, setRules] = useState<DiscountRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<DiscountRule | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [showItemsModal, setShowItemsModal] = useState<number | null>(null);
    const [ruleItems, setRuleItems] = useState<RuleItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        search: '',
        is_active: '' as '' | 'true' | 'false'
    });

    const initialForm = {
        name: '',
        description: '',
        discount_type: 'percentage' as 'percentage' | 'fixed_amount',
        discount_value: 0,
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: '',
        priority: 0
    };
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        loadRules();
    }, [filters]);

    const loadRules = async () => {
        setLoading(true);
        try {
            const data = await getDiscountRules(filters.page, filters.limit);
            dispatch(finishLoading());
            
            let rulesData = data.rules || [];
            
            // Фильтрация на клиенте (если бэк не поддерживает)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                rulesData = rulesData.filter((rule: DiscountRule) =>
                    rule.name.toLowerCase().includes(searchLower) ||
                    (rule.description || '').toLowerCase().includes(searchLower)
                );
            }
            if (filters.is_active) {
                rulesData = rulesData.filter((rule: DiscountRule) =>
                    String(rule.is_active) === filters.is_active
                );
            }
            
            setRules(rulesData);
        } catch (err) {
            setError('Ошибка загрузки правил скидок');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadRuleItems = async (ruleId: number) => {
        setItemsLoading(true);
        try {
            const data = await getDiscountRule(ruleId); // убираем лишнюю запятую
            setRuleItems(data.items || []);
        } catch (err) {
            setError('Ошибка загрузки элементов правила');
            console.error(err);
        } finally {
            setItemsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.name || form.discount_value <= 0) {
            setError('Заполните все обязательные поля');
            return;
        }

        setError('');
        try {
            await createDiscountRule({
                name: form.name,
                description: form.description,
                discount_type: form.discount_type,
                discount_value: form.discount_value,
                starts_at: form.starts_at,
                ends_at: form.ends_at || undefined,
                priority: form.priority,
                items: []
            });
            setSuccess('Правило скидки создано');
            setShowCreateModal(false);
            setForm(initialForm);
            loadRules();
        } catch (err: any) {
            setError(err.message || 'Ошибка создания правила');
        }
    };

    const handleUpdate = async () => {
        if (!showEditModal) return;
        if (!form.name || form.discount_value <= 0) {
            setError('Заполните все обязательные поля');
            return;
        }

        setError('');
        try {
            await updateDiscountRule(showEditModal.id, {
                name: form.name,
                description: form.description,
                discount_type: form.discount_type,
                discount_value: form.discount_value,
                starts_at: form.starts_at,
                ends_at: form.ends_at || undefined,
                priority: form.priority
            });
            setSuccess('Правило обновлено');
            setShowEditModal(null);
            setForm(initialForm);
            loadRules();
        } catch (err: any) {
            setError(err.message || 'Ошибка обновления правила');
        }
    };

    const handleDelete = async (ruleId: number) => {
        try {
            await deleteDiscountRule(ruleId);
            setSuccess('Правило удалено');
            setShowDeleteConfirm(null);
            loadRules();
        } catch (err: any) {
            setError(err.message || 'Ошибка удаления правила');
        }
    };

    const handleToggle = async (ruleId: number) => {
        try {
            await toggleDiscountRule(ruleId);
            loadRules();
        } catch (err: any) {
            setError(err.message || 'Ошибка переключения статуса');
        }
    };

    const openEditModal = (rule: DiscountRule) => {
        setShowEditModal(rule);
        setForm({
            name: rule.name,
            description: rule.description || '',
            discount_type: rule.discount_type,
            discount_value: rule.discount_value,
            starts_at: rule.starts_at?.split('T')[0] || initialForm.starts_at,
            ends_at: rule.ends_at ? rule.ends_at.split('T')[0] : '',
            priority: rule.priority || 0
        });
        setError('');
    };

    const openItemsModal = async (ruleId: number) => {
        setShowItemsModal(ruleId);
        await loadRuleItems(ruleId);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Бессрочно';
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusLabel = (isActive: boolean) => {
        return isActive ? 'Активно' : 'Неактивно';
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <h2>Управление скидками</h2>
                <Button
                    text="+ Создать правило"
                    onClick={() => {
                        setShowCreateModal(true);
                        setForm(initialForm);
                        setError('');
                    }}
                />
            </div>

            {error && <div className={s.error}>{error}</div>}
            {success && <div className={s.success}>{success}</div>}

            {/* Фильтры */}
            <div className={s.filters}>
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    className={s.searchInput}
                />
                <select
                    value={filters.is_active}
                    onChange={(e) => setFilters({ ...filters, is_active: e.target.value as '' | 'true' | 'false', page: 1 })}
                    className={s.filterSelect}
                >
                    <option value="">Все статусы</option>
                    <option value="true">Активные</option>
                    <option value="false">Неактивные</option>
                </select>
            </div>

            {/* Список правил */}
            {loading ? (
                <div className={s.loading}>Загрузка...</div>
            ) : rules.length === 0 ? (
                <div className={s.empty}>Нет правил скидок</div>
            ) : isMobile ? (
                // Мобильные карточки
                <div className={s.cards}>
                    {rules.map((rule) => (
                        <div key={rule.id} className={`${s.card} ${!rule.is_active ? s.inactive : ''}`}>
                            <div className={s.cardHeader}>
                                <div>
                                    <div className={s.cardTitle}>{rule.name}</div>
                                    <div className={s.cardSubtitle}>
                                        {rule.description || 'Без описания'}
                                    </div>
                                </div>
                                <span className={`${s.status} ${rule.is_active ? s.active : s.inactive}`}>
                                    {getStatusLabel(rule.is_active)}
                                </span>
                            </div>
                            <div className={s.cardBody}>
                                <div className={s.cardRow}>
                                    <span>Тип:</span>
                                    <span>{rule.discount_type === 'percentage' ? 'Процент' : 'Фикс. сумма'}</span>
                                </div>
                                <div className={s.cardRow}>
                                    <span>Значение:</span>
                                    <span className={s.value}>
                                        {rule.discount_type === 'percentage'
                                            ? `${rule.discount_value}%`
                                            : `${rule.discount_value}₽`}
                                    </span>
                                </div>
                                <div className={s.cardRow}>
                                    <span>Период:</span>
                                    <span>
                                        {formatDate(rule.starts_at)} — {formatDate(rule.ends_at)}
                                    </span>
                                </div>
                                <div className={s.cardRow}>
                                    <span>Приоритет:</span>
                                    <span>{rule.priority || 0}</span>
                                </div>
                                <div className={s.cardRow}>
                                    <span>Создано:</span>
                                    <span>{formatDateTime(rule.created_at)}</span>
                                </div>
                            </div>
                            <div className={s.cardActions}>
                                <button
                                    className={s.itemsBtn}
                                    onClick={() => openItemsModal(rule.id)}
                                    title="Просмотр элементов"
                                >
                                    📋
                                </button>
                                <button
                                    className={s.editBtn}
                                    onClick={() => openEditModal(rule)}
                                    title="Редактировать"
                                >
                                    ✎
                                </button>
                                <button
                                    className={`${s.toggleBtn} ${rule.is_active ? s.active : ''}`}
                                    onClick={() => handleToggle(rule.id)}
                                    title={rule.is_active ? 'Деактивировать' : 'Активировать'}
                                >
                                    {rule.is_active ? 'ON' : 'OFF'}
                                </button>
                                <button
                                    className={s.deleteBtn}
                                    onClick={() => setShowDeleteConfirm(rule.id)}
                                    title="Удалить"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Десктопная таблица
                <table className={s.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Тип</th>
                            <th>Значение</th>
                            <th>Период</th>
                            <th>Приоритет</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((rule) => (
                            <tr key={rule.id} className={!rule.is_active ? s.inactive : ''}>
                                <td>{rule.id}</td>
                                <td>
                                    <div className={s.ruleName}>
                                        {rule.name}
                                        {rule.description && (
                                            <span className={s.description}>{rule.description}</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {rule.discount_type === 'percentage' ? 'Процент' : 'Фикс. сумма'}
                                </td>
                                <td className={s.value}>
                                    {rule.discount_type === 'percentage'
                                        ? `${rule.discount_value}%`
                                        : `${rule.discount_value}₽`}
                                </td>
                                <td>
                                    {formatDate(rule.starts_at)} — {formatDate(rule.ends_at)}
                                </td>
                                <td>{rule.priority || 0}</td>
                                <td>
                                    <span className={`${s.status} ${rule.is_active ? s.active : s.inactive}`}>
                                        {getStatusLabel(rule.is_active)}
                                    </span>
                                </td>
                                <td>
                                    <div className={s.actions}>
                                        <button
                                            className={s.itemsBtn}
                                            onClick={() => openItemsModal(rule.id)}
                                            title="Просмотр элементов"
                                        >
                                            📋
                                        </button>
                                        <button
                                            className={s.editBtn}
                                            onClick={() => openEditModal(rule)}
                                            title="Редактировать"
                                        >
                                            ✎
                                        </button>
                                        <button
                                            className={`${s.toggleBtn} ${rule.is_active ? s.active : ''}`}
                                            onClick={() => handleToggle(rule.id)}
                                            title={rule.is_active ? 'Деактивировать' : 'Активировать'}
                                        >
                                            {rule.is_active ? 'ON' : 'OFF'}
                                        </button>
                                        <button
                                            className={s.deleteBtn}
                                            onClick={() => setShowDeleteConfirm(rule.id)}
                                            title="Удалить"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Модальное окно создания */}
            {showCreateModal && (
                <div className={s.modal} onClick={() => setShowCreateModal(false)}>
                    <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Создание правила скидки</h3>
                            <button className={s.closeBtn} onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>

                        <div className={s.formGroup}>
                            <label>Название *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Введите название"
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>Описание</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Описание правила"
                                rows={2}
                            />
                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Тип скидки *</label>
                                <select
                                    value={form.discount_type}
                                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                                >
                                    <option value="percentage">Процент (%)</option>
                                    <option value="fixed_amount">Фикс. сумма (₽)</option>
                                </select>
                            </div>
                            <div className={s.formGroup}>
                                <label>Значение *</label>
                                <input
                                    type="number"
                                    value={form.discount_value}
                                    onChange={(e) => setForm({ ...form, discount_value: +e.target.value })}
                                    min={0}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Дата начала *</label>
                                <input
                                    type="date"
                                    value={form.starts_at}
                                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                                />
                            </div>
                            <div className={s.formGroup}>
                                <label>Дата окончания</label>
                                <input
                                    type="date"
                                    value={form.ends_at}
                                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                                />
                                <span className={s.hint}>Оставьте пустым для бессрочной скидки</span>
                            </div>
                        </div>

                        <div className={s.formGroup}>
                            <label>Приоритет</label>
                            <input
                                type="number"
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: +e.target.value })}
                                min={0}
                                placeholder="0"
                            />
                            <span className={s.hint}>Чем выше число, тем выше приоритет</span>
                        </div>

                        <div className={s.modalActions}>
                            <button className={s.cancelBtn} onClick={() => setShowCreateModal(false)}>
                                Отмена
                            </button>
                            <button className={s.submitBtn} onClick={handleCreate}>
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования */}
            {showEditModal && (
                <div className={s.modal} onClick={() => setShowEditModal(null)}>
                    <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Редактирование правила</h3>
                            <button className={s.closeBtn} onClick={() => setShowEditModal(null)}>✕</button>
                        </div>

                        <div className={s.formGroup}>
                            <label>Название *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Введите название"
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>Описание</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Описание правила"
                                rows={2}
                            />
                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Тип скидки *</label>
                                <select
                                    value={form.discount_type}
                                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                                >
                                    <option value="percentage">Процент (%)</option>
                                    <option value="fixed_amount">Фикс. сумма (₽)</option>
                                </select>
                            </div>
                            <div className={s.formGroup}>
                                <label>Значение *</label>
                                <input
                                    type="number"
                                    value={form.discount_value}
                                    onChange={(e) => setForm({ ...form, discount_value: +e.target.value })}
                                    min={0}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Дата начала *</label>
                                <input
                                    type="date"
                                    value={form.starts_at}
                                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                                />
                            </div>
                            <div className={s.formGroup}>
                                <label>Дата окончания</label>
                                <input
                                    type="date"
                                    value={form.ends_at}
                                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                                />
                                <span className={s.hint}>Оставьте пустым для бессрочной скидки</span>
                            </div>
                        </div>

                        <div className={s.formGroup}>
                            <label>Приоритет</label>
                            <input
                                type="number"
                                value={form.priority}
                                onChange={(e) => setForm({ ...form, priority: +e.target.value })}
                                min={0}
                                placeholder="0"
                            />
                            <span className={s.hint}>Чем выше число, тем выше приоритет</span>
                        </div>

                        <div className={s.modalActions}>
                            <button className={s.cancelBtn} onClick={() => setShowEditModal(null)}>
                                Отмена
                            </button>
                            <button className={s.submitBtn} onClick={handleUpdate}>
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно элементов правила */}
            {showItemsModal && (
                <div className={s.modal} onClick={() => setShowItemsModal(null)}>
                    <div className={`${s.modalContent} ${s.itemsModal}`} onClick={e => e.stopPropagation()}>
                        <div className={s.modalHeader}>
                            <h3>Элементы правила #{showItemsModal}</h3>
                            <button className={s.closeBtn} onClick={() => setShowItemsModal(null)}>✕</button>
                        </div>

                        {itemsLoading ? (
                            <div className={s.loading}>Загрузка...</div>
                        ) : ruleItems.length === 0 ? (
                            <div className={s.empty}>Нет элементов в этом правиле</div>
                        ) : (
                            <table className={s.itemsTable}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Тип</th>
                                        <th>ID элемента</th>
                                        <th>Название</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ruleItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.id}</td>
                                            <td>
                                                <span className={s.itemType}>
                                                    {item.item_type === 'brand' ? 'Бренд' :
                                                     item.item_type === 'line' ? 'Линейка' :
                                                     item.item_type === 'product' ? 'Товар' : '—'}
                                                </span>
                                            </td>
                                            <td>{item.item_id}</td>
                                            <td>{item.item_name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className={s.modalActions}>
                            <button className={s.cancelBtn} onClick={() => setShowItemsModal(null)}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            {showDeleteConfirm && (
                <div className={s.modal} onClick={() => setShowDeleteConfirm(null)}>
                    <div className={s.modalContent} onClick={e => e.stopPropagation()}>
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить это правило скидки?</p>
                        <p className={s.warning}>Это действие нельзя отменить! Правило будет удалено для всех сущностей.</p>

                        <div className={s.modalActions}>
                            <button className={s.cancelBtn} onClick={() => setShowDeleteConfirm(null)}>
                                Отмена
                            </button>
                            <button className={s.deleteConfirmBtn} onClick={() => handleDelete(showDeleteConfirm)}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscountRulesManager;