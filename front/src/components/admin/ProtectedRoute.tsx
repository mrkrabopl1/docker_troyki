// components/admin/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';
import { checkAdminAuth } from 'src/providers/adminAuth';
import { setAuthenticated, setInitialized } from 'src/store/reducers/adminSlice';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'superadmin';
    requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children,
    requiredRole,
    requiredPermissions = [] 
}) => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user, isLoading, isInitialized } = useAppSelector(state => state.adminReducer);
    
    useEffect(() => {
        if (!isInitialized) {
            checkAdminAuth((result) => {
                if (result) {
                    dispatch(setAuthenticated(result.admin));
                } else {
                    dispatch(setInitialized());
                }
            });
        }
    }, [dispatch, isInitialized]);
    
    if (isLoading || !isInitialized) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#f8f9fa'
            }}>
                <div>Загрузка...</div>
            </div>
        );
    }
    
    if (!isAuthenticated || !user) {
        router.replace(`/admin/login?redirect=${router.asPath}`);
        return null;
    }
    
    if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
        router.replace('/admin/unauthorized');
        return null;
    }
    
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(
            perm => user.permissions.includes(perm)
        );
        
        if (!hasAllPermissions) {
            router.replace('/admin/unauthorized');
            return null;
        }
    }
    
    return <>{children}</>;
};

export default ProtectedRoute;