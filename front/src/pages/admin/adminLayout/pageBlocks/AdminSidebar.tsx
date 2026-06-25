// components/admin/AdminSidebar/AdminSidebar.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import s from './sidebar.style.module.css';
import { useAppSelector } from 'src/store/hooks/redux';

interface AdminSidebarProps {
    isOpen: boolean;
    isMobile: boolean;
    onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, isMobile, onClose }) => {
    const router = useRouter();
    const { user } = useAppSelector(state => state.adminReducer);

    const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
        const isActive = router.pathname === href || router.pathname.startsWith(href + '/');
        return (
            <Link href={href} className={isActive ? s.active : ''}>
                {children}
            </Link>
        );
    };

    return (
        <aside className={`
            ${s.sidebar} 
            ${isMobile ? s.mobile : s.desktop}
            ${isMobile && isOpen ? s.open : ''}
        `}>
            <div className={s.logo}>
                Admin Panel
                {isMobile && (
                    <button onClick={onClose} className={s.closeBtn}>✕</button>
                )}
            </div>

            <nav className={s.nav}>
                <NavLink href="/admin/dashboard">
                    <span className={s.icon}>📊</span>
                    Дашборд
                </NavLink>

                <NavLink href="/admin/products">
                    <span className={s.icon}>📦</span>
                    Товары
                </NavLink>

                <NavLink href="/admin/products/create">
                    <span className={s.icon}>➕</span>
                    Создать товар
                </NavLink>

                {user?.role === 'superadmin' && (
                    <NavLink href="/admin/orders">
                        <span className={s.icon}>📋</span>
                        Заказы
                    </NavLink>
                )}

                <NavLink href="/admin/discount-manager">
                    <span className={s.icon}>💰</span>
                    Скидки
                </NavLink>
                <NavLink href="/admin/page-blocks">
                    <span className={s.icon}>🧩</span>
                    Блоки страниц
                </NavLink>
                <NavLink href="/admin/brands">
                    <span className={s.icon}>🏷️</span>
                    Бренды
                </NavLink>

                {user?.role === 'superadmin' && (
                    <NavLink href="/admin/logs">
                        <span className={s.icon}>👥</span>
                        Администраторы
                    </NavLink>
                )}

                {user?.role === 'superadmin' && (
                    <NavLink href="/admin/sqlConsole">
                        <span className={s.icon}>💻</span>
                        SQL Консоль
                    </NavLink>
                )}

                <NavLink href="/admin/banners">
                    <span className={s.icon}>🖼️</span>
                    Баннеры
                </NavLink>
            </nav>
        </aside>
    );
};

export default AdminSidebar;