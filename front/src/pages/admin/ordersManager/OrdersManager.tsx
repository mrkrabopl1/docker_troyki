import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus, OrderFilters } from 'src/providers/adminOrdersProvider';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

// Машина состояний - разрешенные переходы (соответствует бэкенду)
const STATUS_TRANSITIONS: Record<string, string[]> = {
    'pending': ['approved', 'rejected'],
    'approved': [],
    'rejected': []
};

// Конфигурация статусов
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'pending': { label: 'В ожидании', color: '#ffd700' },
    'approved': { label: 'Подтвержден', color: '#4caf50' },
    'rejected': { label: 'Отклонен', color: '#f44336' }
};

// Коды причин для отклонения
const REJECTION_REASONS: Record<string, string> = {
    'out_of_stock': 'Нет в наличии',
    'payment_failed': 'Ошибка оплаты',
    'customer_request': 'Запрос клиента',
    'fraud': 'Подозрение на мошенничество',
    'other': 'Другое'
};

const OrdersManager: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<OrderFilters>({
        page: 1,
        page_size: 20,
        sort_by: 'date_desc'
    });
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });

    const isTransitionAllowed = (currentStatus: string, newStatus: string): boolean => {
        // Разрешаем установку того же статуса
        if (currentStatus === newStatus) return true;
        return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
    };

    const isTerminalStatus = (status: string): boolean => {
        return STATUS_TRANSITIONS[status]?.length === 0;
    };

    const getAvailableStatuses = (currentStatus: string) => {
        const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
        
        return Object.entries(STATUS_CONFIG)
            .filter(([status]) => allowedTransitions.includes(status))
            .map(([value, config]) => ({
                value,
                ...config
            }));
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await getOrders(filters);
            dispatch(finishLoading());
            setOrders(data.orders || []);
            setPagination({
                total: data.total || 0,
                pages: data.pages || 1
            });
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [filters]);

    const handleStatusChange = async (orderId: number, newStatus: string) => {
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            alert('Заказ не найден');
            return;
        }

        // Если статус не меняется - ничего не делаем
        if (order.status === newStatus) {
            return;
        }

        if (!isTransitionAllowed(order.status, newStatus)) {
            alert(`Недопустимое изменение статуса!\nПереход из "${STATUS_CONFIG[order.status]?.label}" в "${STATUS_CONFIG[newStatus]?.label}" невозможен.`);
            return;
        }

        let reason: string | undefined;
        let reason_code: string | undefined;

        // Для отклонения требуем причину
        if (newStatus === 'rejected') {
            // Запрашиваем код причины
            const reasonOptions = Object.entries(REJECTION_REASONS)
                .map(([code, label]) => `${code} - ${label}`)
                .join('\n');
            
            reason_code = prompt(
                `📋 Выберите причину отклонения заказа #${orderId}:\n\n${reasonOptions}\n\nВведите код причины:`
            )?.trim().toLowerCase();
            
            if (!reason_code || !REJECTION_REASONS[reason_code]) {
                alert('❌ Необходимо выбрать корректную причину отклонения!');
                return;
            }

            // Запрашиваем детальное описание
            reason = prompt(
                `📝 Укажите детали отклонения заказа #${orderId}:\n` +
                `Причина: ${REJECTION_REASONS[reason_code]}\n\n` +
                `Опишите подробнее:`
            )?.trim();
            
            if (!reason) {
                alert('❌ Необходимо указать причину отклонения!');
                return;
            }

            // Подтверждение
            const confirmed = window.confirm(
                `⚠️ Вы уверены, что хотите отклонить заказ #${orderId}?\n\n` +
                `Код причины: ${REJECTION_REASONS[reason_code]}\n` +
                `Описание: ${reason}\n\n` +
                `Это действие нельзя отменить!`
            );
            
            if (!confirmed) return;
        }

        try {
            setLoading(true);
            
            // Отправляем запрос с новым форматом данных
            await updateOrderStatus(orderId, {
                status: newStatus,
                reason,
                reason_code
            });
            
            // Показываем успешное уведомление
            const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
            alert(`✅ Статус заказа #${orderId} изменен на "${statusLabel}"`);
            
            // Обновляем список заказов
            await loadOrders();
            
        } catch (error: any) {
            console.error('Error updating order status:', error);
            alert(`❌ Ошибка при обновлении статуса:\n${error.message || 'Неизвестная ошибка'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadOrders();
    };

    if (loading && orders.length === 0) {
        return (
            <div className={s.container}>
                <h2>Управление заказами</h2>
                <div className={s.loading}>Загрузка заказов...</div>
            </div>
        );
    }

    return (
        <div className={s.container}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Управление заказами</h2>
                <button
                    className={s.refreshButton}
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? 'Обновление...' : '🔄 Обновить'}
                </button>
            </div>

            {/* Фильтры */}
            <div className={s.filters}>
                <input
                    type="text"
                    placeholder="Поиск по ID, имени, email..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
                <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                    <option value="">Все статусы</option>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                    ))}
                </select>
                <select
                    value={filters.delivery_type || ''}
                    onChange={(e) => setFilters({ ...filters, delivery_type: e.target.value, page: 1 })}
                >
                    <option value="">Все способы доставки</option>
                    <option value="own">Самовывоз</option>
                    <option value="express">Экспресс</option>
                    <option value="cdek">СДЭК</option>
                    <option value="curier">Курьер</option>
                </select>
            </div>

            {/* Таблица заказов */}
            <div className={loading ? s.tableLoading : ''}>
                <table className={s.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Дата</th>
                            <th>Клиент</th>
                            <th>Товаров</th>
                            <th>Сумма</th>
                            <th>Статус</th>
                            <th>Доставка</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={s.empty}>
                                    Заказы не найдены
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => {
                                const availableStatuses = getAvailableStatuses(order.status);
                                const isTerminal = isTerminalStatus(order.status);
                                
                                return (
                                    <tr key={order.id}>
                                        <td>
                                            <span className={s.orderId}>#{order.id}</span>
                                        </td>
                                        <td>{new Date(order.orderdate).toLocaleDateString()}</td>
                                        <td>
                                            {order.customer_name || '—'}<br />
                                            <small>{order.customer_email}</small>
                                        </td>
                                        <td>{order.items_count || 0}</td>
                                        <td>
                                            <span className={s.amount}>
                                                {order.total_amount?.toLocaleString() || 0} ₽
                                            </span>
                                        </td>
                                        <td>
                                            {isTerminal ? (
                                                // Для конечных статусов показываем просто текст
                                                <span 
                                                    className={`${s.statusBadge} ${s[order.status]}`}
                                                    style={{ 
                                                        backgroundColor: STATUS_CONFIG[order.status]?.color,
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        fontSize: '14px',
                                                        display: 'inline-block'
                                                    }}
                                                >
                                                    {STATUS_CONFIG[order.status]?.label}
                                                </span>
                                            ) : (
                                                // Для активных статусов показываем select
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                    className={`${s.statusBadge} ${s[order.status]}`}
                                                    style={{ 
                                                        backgroundColor: STATUS_CONFIG[order.status]?.color,
                                                        color: '#fff',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value={order.status}>
                                                        {STATUS_CONFIG[order.status]?.label} (текущий)
                                                    </option>
                                                    
                                                    {availableStatuses.map(status => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <div className={s.deliveryInfo}>
                                                <span className={s.deliveryType}>
                                                    {order.deliverytype === 'own' && 'Самовывоз'}
                                                    {order.deliverytype === 'express' && 'Экспресс'}
                                                    {order.deliverytype === 'cdek' && 'СДЭК'}
                                                    {order.deliverytype === 'curier' && 'Курьер'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <button 
                                                onClick={() => window.location.href = `/admin/orders/${order.id}`}
                                                style={{
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#f5f5f5'
                                                }}
                                            >
                                                Просмотр
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Пагинация */}
            {pagination.pages > 1 && (
                <div className={s.pagination}>
                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                        disabled={filters.page === 1}
                    >
                        ←
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => {
                        const pageNum = i + 1;
                        if (
                            pageNum === 1 ||
                            pageNum === pagination.pages ||
                            (pageNum >= filters.page! - 2 && pageNum <= filters.page! + 2)
                        ) {
                            return (
                                <button
                                    key={pageNum}
                                    className={filters.page === pageNum ? s.active : ''}
                                    onClick={() => setFilters({ ...filters, page: pageNum })}
                                >
                                    {pageNum}
                                </button>
                            );
                        } else if (
                            pageNum === filters.page! - 3 ||
                            pageNum === filters.page! + 3
                        ) {
                            return <span key={pageNum}>...</span>;
                        }
                        return null;
                    })}

                    <button
                        onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                        disabled={filters.page === pagination.pages}
                    >
                        →
                    </button>
                </div>
            )}

            {/* Информация о количестве */}
            <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
                Всего заказов: {pagination.total}
            </div>
        </div>
    );
};

export default OrdersManager;