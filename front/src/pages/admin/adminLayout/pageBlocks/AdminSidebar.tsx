// components/admin/AdminSidebar/AdminSidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import s from './sidebar.style.module.css';
interface AdminSidebarProps {
    isOpen: boolean;
    isMobile: boolean;
    onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, isMobile, onClose }) => {
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
                    📊 Дашборд
                </NavLink>

                <NavLink
                    to="/admin/products"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    📦 Товары
                </NavLink>
                <NavLink
                    to="/admin/products/create"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    Создать товар
                </NavLink>
                <NavLink
                    to="/admin/orders"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    📋 Заказы
                </NavLink>

                <NavLink
                    to="/admin/sales"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    🏷️ Скидки
                </NavLink>
                <NavLink
                    to="/admin/brands"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    🏷️ Работа с брендами
                </NavLink>

                <NavLink
                    to="/admin/logs"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    🏷️ Работа с администраторами
                </NavLink>
                <NavLink
                    to="/admin/sqlConsole"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    🏷️ Консоль управления
                </NavLink>

                <NavLink
                    to="/admin/banners"
                    className={({ isActive }) => isActive ? s.active : ''}
                >
                    🖼️ Баннеры
                </NavLink>
            </nav>
        </aside>
    );
};

export default AdminSidebar;