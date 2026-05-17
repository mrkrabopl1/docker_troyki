// components/admin/AdminLayout/AdminLayout.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './pageBlocks/AdminSidebar';
import AdminHeader from './pageBlocks/AdminHeader';
import s from './style.module.css';

const AdminLayout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1200);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1200);
        };
        
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    const handleClose = useCallback(() => setSidebarOpen(false), []);
    const handleOpen = useCallback(() => setSidebarOpen(true), []);

    return (
        <div className={s.layout}>
            <AdminSidebar 
                isOpen={isMobile ? sidebarOpen : true} 
                isMobile={isMobile}
                onClose={handleClose} 
            />
            
            {isMobile && sidebarOpen && (
                <div className={s.overlay} onClick={handleClose} />
            )}
            
            <div className={`${s.mainWrapper} ${!isMobile ? s.withSidebar : ''}`}>
                <AdminHeader onMenuClick={handleOpen} isMobile={isMobile} />
                <main className={s.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;