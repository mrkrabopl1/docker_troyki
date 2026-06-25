// components/admin/AdminHeader/AdminHeader.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { logoutAdmin } from 'src/providers/adminAuth';
import { logout } from 'src/store/reducers/adminSlice';
import s from './header.style.module.css';

interface AdminHeaderProps {
    onMenuClick: () => void;
    isMobile: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, isMobile }) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.adminReducer);
    
    const handleLogout = () => {
        logoutAdmin(() => {
            dispatch(logout());
            console.debug('Admin logged out');
            router.push('/admin/login');
        });
    };
    
    return (
        <header className={s.header}>
            {isMobile && (
                <button onClick={onMenuClick} className={s.menuBtn}>
                    ☰ Меню
                </button>
            )}
            <div className={s.left}>
                <h1>Админ-панель</h1>
            </div>
            
            <div className={s.right}>
                <span className={s.user}>
                    {user?.name} ({user?.role})
                </span>
                <button onClick={handleLogout} className={s.logoutBtn}>
                    Выйти
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;