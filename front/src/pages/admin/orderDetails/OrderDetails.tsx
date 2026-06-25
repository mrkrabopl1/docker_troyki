// src/pages/admin/OrderDetails/index.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getOrderDetails } from 'src/providers/adminOrdersProvider';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

// Конфигурация статусов
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'pending': { label: 'В ожидании', color: '#ffd700' },
    'approved': { label: 'Подтвержден', color: '#4caf50' },
    'rejected': { label: 'Отклонен', color: '#f44336' }
};

// Типы доставки
const DELIVERY_TYPES: Record<string, string> = {
    'own': 'Самовывоз',
    'express': 'Экспресс',
    'cdek': 'СДЭК',
    'curier': 'Курьер'
};

interface OrderEvent {
    id: number;
    event_type: string;
    old_status: string | null;
    new_status: string | null;
    reason: string | null;
    reason_code: string | null;
    changed_by_type: string;
    admin_name?: string;
    admin_email?: string;
    ip_address?: string;
    metadata?: any;
    created_at: string;
}

interface OrderItem {
    id: number;
    product_id: number;
    name: string;
    image_path: string;
    size: string | null;
    quantity: number;
    price: number;
}

interface CustomerData {
    id?: number;
    name?: string;
    secondName?: string;
    mail?: string;
    phone?: string;
    town?: string;
    index?: string;
    street?: string;
    region?: string;
    house?: string;
    flat?: string;
}

interface UnregisterCustomer {
    id?: number;
    name?: string;
    secondName?: string;
    mail?: string;
    phone?: string;
    town?: string;
    index?: string;
    street?: string;
    settlement?: string;
    region?: string;
    house?: string;
    flat?: string;
    deliveryComment?: string;
}

interface OrderDetails {
    id: number;
    orderdate: string;
    status: string;
    deliverytype: string;
    deliveryprice: number;
    deliverycomment?: string;
    hash: string;
    total_amount: number;
    items_count: number;
    customer?: CustomerData;
    unregistercustomer?: UnregisterCustomer;
    items: OrderItem[];
    address?: {
        town: string;
        index: string;
        street?: string;
        region?: string;
        house?: string;
        flat?: string;
        coordinates?: string[];
    };
}

const OrderDetails: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [history, setHistory] = useState<OrderEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'items' | 'history'>('info');
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (id) {
            loadOrderData(parseInt(id as string));
        }
    }, [id]);

    const loadOrderData = async (orderId: number) => {
        try {
            setLoading(true);
            const data = await getOrderDetails(orderId);
            dispatch(finishLoading());

            setOrder({
                ...data
            });
            setHistory(data.history || []);

        } catch (error) {
            console.error('Error loading order:', error);
            alert('Ошибка при загрузке данных заказа');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number) => {
        return price?.toLocaleString('ru-RU') + ' ₽';
    };

    if (loading) {
        return (
            <div className={s.container}>
                <div className={s.loading}>Загрузка данных заказа...</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={s.container}>
                <div className={s.error}>Заказ не найден</div>
                <button onClick={() => router.push('/admin/orders')} className={s.backButton}>
                    ← Вернуться к списку заказов
                </button>
            </div>
        );
    }

    const customer = order.customer || order.unregistercustomer;
    const isRegistered = !!order.customer;

    return (
        <div className={s.container}>
            {/* Хедер */}
            <div className={s.header}>
                <button onClick={() => router.push('/admin/orders')} className={s.backButton}>
                    ← Назад к списку
                </button>
                <h1>Заказ #{order.id}</h1>
                <span
                    className={s.statusBadge}
                    style={{ backgroundColor: STATUS_CONFIG[order.status]?.color }}
                >
                    {STATUS_CONFIG[order.status]?.label}
                </span>
            </div>

            {/* Табы */}
            <div className={s.tabs}>
                <button
                    className={`${s.tab} ${activeTab === 'info' ? s.activeTab : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    📋 Информация
                </button>
                <button
                    className={`${s.tab} ${activeTab === 'items' ? s.activeTab : ''}`}
                    onClick={() => setActiveTab('items')}
                >
                    📦 Товары ({order.items?.length || 0})
                </button>
                <button
                    className={`${s.tab} ${activeTab === 'history' ? s.activeTab : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📜 История ({history.length})
                </button>
            </div>

            {/* Контент табов */}
            <div className={s.tabContent}>
                {/* Информация о заказе и клиенте */}
                {activeTab === 'info' && (
                    <div className={s.infoGrid}>
                        {/* Данные заказа */}
                        <div className={s.card}>
                            <h3>📋 Данные заказа</h3>
                            <div className={s.infoRow}>
                                <span className={s.label}>ID заказа:</span>
                                <span className={s.value}>#{order.id}</span>
                            </div>
                            <div className={s.infoRow}>
                                <span className={s.label}>Дата создания:</span>
                                <span className={s.value}>{formatDate(order.orderdate)}</span>
                            </div>
                            <div className={s.infoRow}>
                                <span className={s.label}>Статус:</span>
                                <span
                                    className={s.statusBadge}
                                    style={{ backgroundColor: STATUS_CONFIG[order.status]?.color }}
                                >
                                    {STATUS_CONFIG[order.status]?.label}
                                </span>
                            </div>
                            <div className={s.infoRow}>
                                <span className={s.label}>Тип доставки:</span>
                                <span className={s.value}>{DELIVERY_TYPES[order.deliverytype] || order.deliverytype}</span>
                            </div>
                            <div className={s.infoRow}>
                                <span className={s.label}>Стоимость доставки:</span>
                                <span className={s.value}>{formatPrice(order.deliveryprice)}</span>
                            </div>
                            {order.deliverycomment && (
                                <div className={s.infoRow}>
                                    <span className={s.label}>Комментарий к доставке:</span>
                                    <span className={s.value}>{order.deliverycomment}</span>
                                </div>
                            )}
                            <div className={s.infoRow}>
                                <span className={s.label}>Количество товаров:</span>
                                <span className={s.value}>{order.items_count} шт.</span>
                            </div>
                            <div className={s.infoRow}>
                                <span className={s.label}>Общая сумма:</span>
                                <span className={s.totalAmount}>{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>

                        {/* Данные клиента */}
                        {customer && (
                            <div className={s.card}>
                                <h3>
                                    {isRegistered ? '👤 Зарегистрированный клиент' : '📧 Незарегистрированный клиент'}
                                </h3>

                                <div className={s.infoRow}>
                                    <span className={s.label}>Имя:</span>
                                    <span className={s.value}>
                                        {customer.name || '—'} {customer.secondName || ''}
                                    </span>
                                </div>

                                <div className={s.infoRow}>
                                    <span className={s.label}>Email:</span>
                                    <span className={s.value}>{customer.mail || '—'}</span>
                                </div>

                                <div className={s.infoRow}>
                                    <span className={s.label}>Телефон:</span>
                                    <span className={s.value}>{customer.phone || '—'}</span>
                                </div>

                                {isRegistered && (
                                    <div className={s.infoRow}>
                                        <span className={s.label}>ID клиента:</span>
                                        <span className={s.value}>
                                            <a href={`/admin/customers/${order.customer?.id}`}>
                                                #{order.customer?.id}
                                            </a>
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Адрес доставки */}
                        {(order.address || customer) && (
                            <div className={s.card}>
                                <h3>📍 Адрес доставки</h3>

                                {order.address ? (
                                    <>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Город:</span>
                                            <span className={s.value}>{order.address.town || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Индекс:</span>
                                            <span className={s.value}>{order.address.index || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Регион:</span>
                                            <span className={s.value}>{order.address.region || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Улица:</span>
                                            <span className={s.value}>{order.address.street || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Дом:</span>
                                            <span className={s.value}>{order.address.house || '—'}</span>
                                        </div>
                                        {order.address.flat && (
                                            <div className={s.infoRow}>
                                                <span className={s.label}>Квартира:</span>
                                                <span className={s.value}>{order.address.flat}</span>
                                            </div>
                                        )}
                                        {order.address.coordinates && (
                                            <div className={s.infoRow}>
                                                <span className={s.label}>Координаты:</span>
                                                <span className={s.value}>
                                                    {order.address.coordinates.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Город:</span>
                                            <span className={s.value}>{customer?.town || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Индекс:</span>
                                            <span className={s.value}>{customer?.index || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Регион:</span>
                                            <span className={s.value}>{customer?.region || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Улица:</span>
                                            <span className={s.value}>{customer?.street || '—'}</span>
                                        </div>
                                        <div className={s.infoRow}>
                                            <span className={s.label}>Дом:</span>
                                            <span className={s.value}>{customer?.house || '—'}</span>
                                        </div>
                                        {customer?.flat && (
                                            <div className={s.infoRow}>
                                                <span className={s.label}>Квартира:</span>
                                                <span className={s.value}>{customer.flat}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Хеш заказа */}
                        <div className={s.card}>
                            <h3>🔐 Служебная информация</h3>
                            <div className={s.infoRow}>
                                <span className={s.label}>Хеш заказа:</span>
                                <span className={s.hashValue}>{order.hash}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Товары в заказе */}
                {activeTab === 'items' && (
                    <div className={s.itemsSection}>
                        <h3>📦 Товары в заказе ({order.items?.length || 0})</h3>
                        {order.items && order.items.length > 0 ? (
                            <table className={s.itemsTable}>
                                <thead>
                                    <tr>
                                        <th>Фото</th>
                                        <th>Название</th>
                                        <th>Размер</th>
                                        <th>Количество</th>
                                        <th>Цена</th>
                                        <th>Сумма</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <img
                                                    src={item.image_path}
                                                    alt={item.name}
                                                    className={s.itemImage}
                                                />
                                            </td>
                                            <td>
                                                <a href={`/admin/products/${item.product_id}`}>
                                                    {item.name}
                                                </a>
                                            </td>
                                            <td>{item.size || '—'}</td>
                                            <td>{item.quantity} шт.</td>
                                            <td>{formatPrice(item.price)}</td>
                                            <td className={s.itemTotal}>
                                                {formatPrice(item.price * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={4} className={s.totalLabel}>
                                            Итого ({order.items_count} товаров):
                                        </td>
                                        <td colSpan={2} className={s.totalValue}>
                                            {formatPrice(order.total_amount)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <div className={s.empty}>Нет товаров в заказе</div>
                        )}
                    </div>
                )}

                {/* История изменений */}
                {activeTab === 'history' && (
                    <div className={s.historySection}>
                        <h3>📜 История изменений заказа</h3>
                        {history.length > 0 ? (
                            <div className={s.timeline}>
                                {history.map((event, index) => (
                                    <div key={event.id} className={s.timelineItem}>
                                        <div className={s.timelineDot}></div>
                                        {index < history.length - 1 && (
                                            <div className={s.timelineLine}></div>
                                        )}
                                        <div className={s.timelineContent}>
                                            <div className={s.timelineHeader}>
                                                <span className={s.timelineDate}>
                                                    {formatDate(event.created_at)}
                                                </span>
                                                <span className={s.eventType}>
                                                    {event.event_type === 'status_change' ? 'Изменение статуса' : event.event_type}
                                                </span>
                                            </div>

                                            {event.event_type === 'status_change' && (
                                                <div className={s.statusChange}>
                                                    {event.old_status && (
                                                        <span
                                                            className={s.statusBadge}
                                                            style={{
                                                                backgroundColor: STATUS_CONFIG[event.old_status]?.color || '#999',
                                                                opacity: 0.7
                                                            }}
                                                        >
                                                            {STATUS_CONFIG[event.old_status]?.label || event.old_status}
                                                        </span>
                                                    )}
                                                    <span className={s.arrow}>→</span>
                                                    {event.new_status && (
                                                        <span
                                                            className={s.statusBadge}
                                                            style={{
                                                                backgroundColor: STATUS_CONFIG[event.new_status]?.color || '#999'
                                                            }}
                                                        >
                                                            {STATUS_CONFIG[event.new_status]?.label || event.new_status}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {event.reason && (
                                                <div className={s.reasonBlock}>
                                                    <strong>Причина:</strong>
                                                    {event.reason_code && (
                                                        <span className={s.reasonCode}>
                                                            [{event.reason_code}]
                                                        </span>
                                                    )}
                                                    <p>{event.reason}</p>
                                                </div>
                                            )}

                                            <div className={s.eventMeta}>
                                                <span>
                                                    Изменил: {event.admin_name || event.admin_email || 'Система'}
                                                </span>
                                                {event.ip_address && (
                                                    <span>IP: {event.ip_address}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={s.empty}>История изменений пуста</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;