// components/admin/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';
import { checkAdminAuth } from 'src/providers/adminAuth';
import { setAuthenticated, setInitialized } from 'src/store/reducers/adminSlice';

interface ProtectedRouteProps {
    requiredRole?: 'admin' | 'superadmin';
    requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    requiredRole,
    requiredPermissions = [] 
}) => {
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user, isLoading, isInitialized } = useAppSelector(state => state.adminReducer);
    
    useEffect(() => {
        if (!isInitialized) {
            checkAdminAuth((result) => {
                if (result.admin) {
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
        return <Navigate to={`/admin/login?redirect=${location.pathname}`} replace />;
    }
    
    if (requiredRole && requiredRole === 'superadmin' && user.role !== 'superadmin') {
        return <Navigate to="/admin/unauthorized" replace />;
    }
    
    if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(
            perm => user.permissions.includes(perm)
        );
        
        if (!hasAllPermissions) {
            return <Navigate to="/admin/unauthorized" replace />;
        }
    }
    
    return <Outlet />;
};

export default ProtectedRoute;