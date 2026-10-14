import React, { useEffect, useState, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import { getOrderHistory } from 'src/providers/userProvider';
import s from './orderHistoryTab.module.css';

type OrderItem = {
    id: number;
    order_date: string;      // "2026-10-11T00:00:00Z"
    status: string;          // "pending" | "approved" | "rejected"
    hash: string;
    delivery_price: number;
    delivery_comment: string | null;
    delivery_type: string;   // "cdek" | "curier" | "own" | "express"
    created_at: string;
    items_count: number;
    total_price: number;
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'В обработке',
    approved: 'Подтверждён',
    rejected: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
    pending: s.statusPending,
    approved: s.statusApproved,
    rejected: s.statusRejected,
};

const DELIVERY_LABELS: Record<string, string> = {
    cdek: 'СДЭК',
    curier: 'Курьер',
    own: 'Самовывоз',
    express: 'Экспресс',
};

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(price);
}

const OrderHistoryTab: React.FC = () => {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await getOrderHistory();
                if (!cancelled) setOrders(data || []);
            } catch (err) {
                console.warn('[OrderHistoryTab]', err);
                if (!cancelled) setOrders([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    const handleOrderClick = useCallback((hash: string) => {
        router.push(`/order/${hash}`);
    }, [router]);

    if (loading) {
        return <div className={s.loading}>Загрузка заказов...</div>;
    }

    if (!orders.length) {
        return <div className={s.empty}>У вас пока нет заказов</div>;
    }

    return (
        <div className={s.list}>
            {orders.map(order => (
                <div
                    key={order.id}
                    className={s.item}
                    onClick={() => handleOrderClick(order.hash)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOrderClick(order.hash);
                        }
                    }}
                >
                    <div className={s.itemHeader}>
                        <div className={s.itemTitle}>
                            Заказ №{order.id}
                            <span className={s.itemDate}>
                                от {formatDate(order.order_date)}
                            </span>
                        </div>
                        <div className={`${s.status} ${STATUS_COLORS[order.status] || ''}`}>
                            {STATUS_LABELS[order.status] || order.status}
                        </div>
                    </div>

                    <div className={s.itemBody}>
                        <div className={s.itemMeta}>
                            <div className={s.metaRow}>
                                <span className={s.metaLabel}>Товаров:</span>
                                <span className={s.metaValue}>{order.items_count}</span>
                            </div>
                            <div className={s.metaRow}>
                                <span className={s.metaLabel}>Доставка:</span>
                                <span className={s.metaValue}>
                                    {DELIVERY_LABELS[order.delivery_type] || order.delivery_type}
                                </span>
                            </div>
                            {order.delivery_comment && (
                                <div className={s.metaRow}>
                                    <span className={s.metaLabel}>Комментарий:</span>
                                    <span className={s.metaValue}>{order.delivery_comment}</span>
                                </div>
                            )}
                        </div>

                        <div className={s.itemPrice}>
                            {formatPrice(order.total_price + order.delivery_price)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default memo(OrderHistoryTab);