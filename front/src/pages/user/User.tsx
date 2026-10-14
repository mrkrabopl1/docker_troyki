import React, { Suspense, useEffect, useState, useCallback, lazy, memo } from 'react';
import { useRouter } from 'next/router';
import { unlogin, getMe } from 'src/providers/userProvider';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { clearUser, setUser } from 'src/store/reducers/userSlice';
import s from './s.module.css';

// 👇 lazy — грузится только когда вкладка активна
const InfoTab = lazy(() => import('./tabs/InfoTab'));
const AddressTab = lazy(() => import('./tabs/AddressTab'));
const OrderHistoryTab = lazy(() => import('./tabs/OrderHistoryTab'));
const PromoTab = lazy(() => import('./tabs/PromoTab'));

const UserTabs = memo(({
    activeTab,
    onTabChange,
    onLogout,
}: {
    activeTab: number;
    onTabChange: (tab: number) => void;
    onLogout: () => void;
}) => {
    const tabs = [
        { id: 0, label: 'Инфо' },
        { id: 1, label: 'Адрес' },
        { id: 2, label: 'История покупок' },
        { id: 3, label: 'Промокоды' },
    ];

    return (
        <div className={s.tabs} role="tablist">
            {tabs.map(({ id, label }) => (
                <div
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id}
                    tabIndex={0}
                    className={activeTab === id ? s.activeTab : ''}
                    onClick={() => onTabChange(id)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onTabChange(id);
                        }
                    }}
                >
                    {label}
                </div>
            ))}
            <div
                role="button"
                tabIndex={0}
                onClick={onLogout}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onLogout();
                    }
                }}
                className={s.logoutTab}
            >
                Выход
            </div>
        </div>
    );
});

const TabFallback = () => (
    <div style={{ padding: 24, color: '#888', fontSize: 14 }}>
        Загрузка...
    </div>
);

const User: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    // 👇 всё из Redux, никаких запросов в этом компоненте
    const { isLog, isAuthChecked, user } = useAppSelector(state => state.user);
    const [tab, setTab] = useState(0);

    // Редирект неавторизованных — только после проверки /auth/me
    useEffect(() => {
        if (!isAuthChecked) return;
        if (!isLog) router.replace('/');
    }, [isAuthChecked, isLog, router]);

    const handleTabChange = useCallback((tabIndex: number) => {
        setTab(tabIndex);
    }, []);

    const handleLogout = useCallback(() => {
        unlogin(() => {
            dispatch(clearUser());
            router.push('/');
        });
    }, [dispatch, router]);

    // После сохранения формы — перезапрашиваем /auth/me и обновляем Redux
    const handleUserUpdated = useCallback(async () => {
        const fresh = await getMe();
        if (fresh) dispatch(setUser(fresh));
    }, [dispatch]);

    // Пока /auth/me не ответил
    if (!isAuthChecked) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;
    }

    // Не залогинен — useEffect уже редиректит
    if (!isLog) return null;

    return (
        <div className={s.main}>
            <UserTabs
                activeTab={tab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
            />

            <div className={s.pages}>
                <Suspense fallback={<TabFallback />}>
                    {tab === 0 && (
                        <InfoTab user={user} onSaved={handleUserUpdated} />
                    )}
                    {tab === 1 && (
                        <AddressTab />
                    )}
                    {tab === 2 && (
                        <OrderHistoryTab  />
                    )}
                    {tab === 3 && <PromoTab />}
                </Suspense>
            </div>
        </div>
    );
};

export default memo(User);