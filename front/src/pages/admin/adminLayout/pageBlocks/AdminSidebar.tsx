// components/admin/AdminSidebar/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import s from './sidebar.style.module.css';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
interface AdminSidebarProps {
    isOpen: boolean;
    isMobile: boolean;
    onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, isMobile, onClose }) => {
    const { user } = useAppSelector(state => state.adminReducer);
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
                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    <span className={s.icon}>📊</span>
                    Дашборд
                </NavLink>

                <NavLink
                    to="/admin/products"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    <span className={s.icon}>📦</span>
                    Товары
                </NavLink>

                <NavLink
                    to="/admin/products/create"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    <span className={s.icon}>➕</span>
                    Создать товар
                </NavLink>

                {
                    user?.role === 'superadmin' && <NavLink
                        to="/admin/orders"
                        className={({ isActive }) => isActive ? s.active : ''}
                    >
                        <span className={s.icon}>📋</span>
                        Заказы
                    </NavLink>
                }

                <NavLink
                    to="/admin/sales"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    <span className={s.icon}>💰</span>
                    Скидки
                </NavLink>

                <NavLink
                    to="/admin/brands"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    <span className={s.icon}>🏷️</span>
                    Бренды
                </NavLink>
                {
                    user?.role === 'superadmin' && <NavLink
                        to="/admin/logs"
                        className={({ isActive }) => isActive ? s.active : ''}
                    >
                        <span className={s.icon}>👥</span>
                        Администраторы
                    </NavLink>
                }


                {
                    user?.role === 'superadmin' && <NavLink
                        to="/admin/sqlConsole"
                        className={({ isActive }) => isActive ? s.active : ''}
                    >
                        <span className={s.icon}>💻</span>
                        SQL Консоль
                    </NavLink>
                }

                <NavLink
                    to="/admin/banners"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    <span className={s.icon}>🖼️</span>
                    Баннеры
                </NavLink>
            </nav>
        </aside>
    );
};

export default AdminSidebar;