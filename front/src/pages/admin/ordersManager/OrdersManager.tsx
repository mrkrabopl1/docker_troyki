import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus, OrderFilters } from 'src/providers/adminOrdersProvider';
import s from './style.module.css';

const OrdersManager: React.FC = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<OrderFilters>({
        page: 1,
        page_size: 20,
        sort_by: 'date_desc'
    });
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getOrders(filters);
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
        try {
            await updateOrderStatus(orderId, newStatus);
            await loadOrders(); // Обновляем список после изменения
        } catch (error) {
            alert('Ошибка при обновлении статуса');
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
                    <option value="pending">В ожидании</option>
                    <option value="approved">Подтвержден</option>
                    <option value="rejected">Отклонен</option>
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
                            orders.map((order: any) => (
                                <tr key={order.id}>
                                    <td>
                                        <span className={s.orderId}>#{order.id}</span>
                                    </td>
                                    <td>{new Date(order.orderdate).toLocaleDateString()}</td>
                                    <td>
                                        {order.customer_name || '—'}<br/>
                                        <small>{order.customer_email}</small>
                                    </td>
                                    <td>{order.items_count || 0}</td>
                                    <td>
                                        <span className={s.amount}>
                                            {order.total_amount?.toLocaleString() || 0} ₽
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`${s.statusBadge} ${s[order.status]}`}
                                        >
                                            <option value="pending">В ожидании</option>
                                            <option value="approved">Подтвержден</option>
                                            <option value="rejected">Отклонен</option>
                                        </select>
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
                                        <button onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                                            Просмотр
                                        </button>
                                    </td>
                                </tr>
                            ))
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
                        // Показываем только ближайшие страницы
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