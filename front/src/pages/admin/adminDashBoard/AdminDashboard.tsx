// pages/admin/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getStats } from 'src/providers/adminProductsProvider';
import s from './style.module.css';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

interface DashboardStats {
    total_products: number;
    total_firms: number;
    total_categories: number;
    pending_orders: number;
    approved_orders: number;
    rejected_orders: number;
    total_orders: number;
    total_revenue: number;
    registered_users: number;
    unique_visitors: number;
    unregistered_customers: number;
    new_users_30d: number;
    products_in_stock: number;
    total_items_in_stock: number;
    out_of_stock_items: number;
    products_on_discount: number;
    active_discounts: number;
    orders_last_7_days: number;
}

const AdminDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        total_products: 0, total_firms: 0, total_categories: 0,
        pending_orders: 0, approved_orders: 0, rejected_orders: 0,
        total_orders: 0, total_revenue: 0, registered_users: 0,
        unique_visitors: 0, unregistered_customers: 0, new_users_30d: 0,
        products_in_stock: 0, total_items_in_stock: 0, out_of_stock_items: 0,
        products_on_discount: 0, active_discounts: 0, orders_last_7_days: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            await getStats((data: DashboardStats) => {
                setStats(data);
                setLoading(false);
            });
            dispatch(finishLoading());
        } catch (err) {
            console.error('Error loading stats:', err);
            setError('Не удалось загрузить статистику');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className={s.dashboard}>
                <h2>Дашборд</h2>
                <div className={s.loader}>Загрузка статистики...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={s.dashboard}>
                <h2>Дашборд</h2>
                <div className={s.error}>
                    <p>{error}</p>
                    <button onClick={loadStats}>Повторить</button>
                </div>
            </div>
        );
    }

    return (
        <div className={s.dashboard}>
            <h2>Дашборд</h2>

            <div className={s.statsGrid}>
                <div className={s.statCard} onClick={() => router.push('/admin/products')}>
                    <div className={s.statValue}>{stats.total_products}</div>
                    <div className={s.statLabel}>Товаров</div>
                    <div className={s.statDetail}>В наличии: {stats.products_in_stock}</div>
                </div>

                <div className={s.statCard} onClick={() => router.push('/admin/orders')}>
                    <div className={s.statValue}>{stats.total_orders}</div>
                    <div className={s.statLabel}>Заказов</div>
                    <div className={s.statDetail}>
                        В работе: {stats.pending_orders} | Завершено: {stats.approved_orders}
                    </div>
                </div>

                <div className={s.statCard}>
                    <div className={s.statValue}>{stats.registered_users}</div>
                    <div className={s.statLabel}>Пользователей</div>
                    <div className={s.statDetail}>Новых за 30 дней: {stats.new_users_30d}</div>
                </div>

                <div className={s.statCard}>
                    <div className={s.statValue}>{stats.total_revenue.toLocaleString()} ₽</div>
                    <div className={s.statLabel}>Выручка</div>
                    <div className={s.statDetail}>Заказов за 7 дней: {stats.orders_last_7_days}</div>
                </div>
            </div>

            <div className={s.statsGridSecondary}>
                <div className={s.statCardSmall}>
                    <div className={s.statValue}>{stats.total_firms}</div>
                    <div className={s.statLabel}>Брендов</div>
                </div>

                <div className={s.statCardSmall}>
                    <div className={s.statValue}>{stats.products_on_discount}</div>
                    <div className={s.statLabel}>Товаров со скидкой</div>
                </div>

                <div className={s.statCardSmall}>
                    <div className={s.statValue}>{stats.out_of_stock_items}</div>
                    <div className={s.statLabel}>Товаров нет в наличии</div>
                </div>

                <div className={s.statCardSmall}>
                    <div className={s.statValue}>{stats.unique_visitors}</div>
                    <div className={s.statLabel}>Уникальных посетителей</div>
                </div>
            </div>

            <div className={s.quickActions}>
                <h3>Быстрые действия</h3>
                <div className={s.actionsGrid}>
                    <button onClick={() => router.push('/admin/products')}>
                        ➕ Добавить товар
                    </button>
                    <button onClick={() => router.push('/admin/sales/create')}>
                        🏷️ Создать скидку
                    </button>
                    <button onClick={() => router.push('/admin/banners')}>
                        🖼️ Добавить баннер
                    </button>
                    <button onClick={loadStats} className={s.refreshBtn}>
                        🔄 Обновить статистику
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;