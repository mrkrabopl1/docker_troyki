import React, { useEffect, useState, useCallback } from 'react';
import { getLogs, getAdmins, inviteAdmin, deleteAdmin, updateAdmin } from 'src/providers/adminProvider';
import DatePicker from 'src/components/input/DatePicker';
import s from './style.module.css';
import { useAppDispatch, useAppSelector, useMediaQuery } from 'src/store/hooks/redux'
import { finishLoading } from 'src/store/reducers/loadingSlice';


interface Admin {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'superadmin';
    is_active: boolean;
    last_login_at: string;
    created_at: string;
}

const AdminLogs: React.FC = () => {
    const dispatch = useAppDispatch();
    const [logs, setLogs] = useState([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'admin' as 'admin' | 'superadmin'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        admin_id: 0,
        action: '',
        date_from: '',
        date_to: ''
    });
    const { user } = useAppSelector(state => state.adminReducer);
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        loadAdmins();
        loadLogs();
    }, [filters]);

    const loadAdmins = async () => {
        try {
            const data = await getAdmins({ page: 1, limit: 100 });
            setAdmins(data.admins || []);
        } catch (err) {
            console.error('Failed to load admins:', err);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getLogs(filters);
            dispatch(finishLoading());
            setLogs(data.logs || []);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        setError('');
        setSuccess('');

        if (!inviteForm.email) {
            setError('Введите email');
            return;
        }

        try {
            await inviteAdmin(inviteForm);
            setSuccess('Приглашение отправлено успешно');
            setShowInviteModal(false);
            setInviteForm({ email: '', role: 'admin' });
            loadAdmins();
            loadLogs();
        } catch (err: any) {
            setError(err.message || 'Ошибка при отправке приглашения');
        }
    };

    const handleDeleteAdmin = async (adminId: number) => {
        try {
            await deleteAdmin(adminId);
            setShowDeleteConfirm(null);
            loadAdmins();
            loadLogs();
            setSuccess('Администратор удален');
        } catch (err: any) {
            setError(err.message || 'Ошибка при удалении');
        }
    };

    const handleToggleActive = async (admin: Admin) => {
        try {
            await updateAdmin(admin.id, { is_active: !admin.is_active });
            loadAdmins();
            loadLogs();
            setSuccess(`Администратор ${admin.is_active ? 'деактивирован' : 'активирован'}`);
        } catch (err: any) {
            setError(err.message || 'Ошибка при обновлении');
        }
    };

    const handleDateFromChange = useCallback((value: string) => {
        setFilters(prev => ({ ...prev, date_from: value, page: 1 }));
    }, []);

    const handleDateToChange = useCallback((value: string) => {
        setFilters(prev => ({ ...prev, date_to: value, page: 1 }));
    }, []);

    const actionLabels: Record<string, string> = {
        'create': 'Создание',
        'update': 'Обновление',
        'delete': 'Удаление',
        'update_status': 'Изменение статуса',
        'login': 'Вход',
        'logout': 'Выход',
        'invite_admin': 'Приглашение админа',
        'change': 'Смена пароля',
        'password_reset_request': 'Запрос сброса пароля'
    };

    return (
        <div className={s.container}>
            <h2>Логи администраторов</h2>

            {/* Управление админами - видно только суперадмину */}
            {user.role === "superadmin" && (
                <div className={s.adminManagement}>
                    <div className={s.adminHeader}>
                        <h3>Управление администраторами</h3>
                        <button
                            className={s.inviteBtn}
                            onClick={() => setShowInviteModal(true)}
                        >
                            ➕ Пригласить
                        </button>
                    </div>

                    {error && <div className={s.error}>{error}</div>}
                    {success && <div className={s.success}>{success}</div>}

                    {/* Мобильные карточки админов */}
                    {isMobile ? (
                        <div className={s.adminCards}>
                            {admins.map((admin) => (
                                <div key={admin.id} className={s.adminCard}>
                                    <div className={s.adminCardHeader}>
                                        <div>
                                            <div className={s.adminName}>{admin.name}</div>
                                            <div className={s.adminEmail}>{admin.email}</div>
                                        </div>
                                        <span className={`${s.role} ${s[admin.role]}`}>
                                            {admin.role === 'superadmin' ? 'Суперадмин' : 'Админ'}
                                        </span>
                                    </div>
                                    <div className={s.adminCardBody}>
                                        <div className={s.adminCardRow}>
                                            <span>Статус:</span>
                                            <span className={`${s.status} ${admin.is_active ? s.active : s.inactive}`}>
                                                {admin.is_active ? 'Активен' : 'Неактивен'}
                                            </span>
                                        </div>
                                        <div className={s.adminCardRow}>
                                            <span>Последний вход:</span>
                                            <span>{admin.last_login_at
                                                ? new Date(admin.last_login_at).toLocaleString()
                                                : '—'}</span>
                                        </div>
                                    </div>
                                    <div className={s.adminCardActions}>
                                        {admin.id !== user?.id ? (
                                            <>
                                                <button onClick={() => handleToggleActive(admin)}>
                                                    {admin.is_active ? '🔒 Деактивировать' : '🔓 Активировать'}
                                                </button>
                                                <button onClick={() => setShowDeleteConfirm(admin.id)}>
                                                    🗑️ Удалить
                                                </button>
                                            </>
                                        ) : (
                                            <span className={s.currentUser}>Это вы</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Десктопная таблица */
                        <table className={s.adminTable}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Имя</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Статус</th>
                                    <th>Последний вход</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className={!admin.is_active ? s.inactive : ''}>
                                        <td>{admin.id}</td>
                                        <td>{admin.name}</td>
                                        <td>{admin.email}</td>
                                        <td>
                                            <span className={`${s.role} ${s[admin.role]}`}>
                                                {admin.role === 'superadmin' ? 'Суперадмин' : 'Админ'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${s.status} ${admin.is_active ? s.active : s.inactive}`}>
                                                {admin.is_active ? 'Активен' : 'Неактивен'}
                                            </span>
                                        </td>
                                        <td>
                                            {admin.last_login_at
                                                ? new Date(admin.last_login_at).toLocaleString()
                                                : '—'}
                                        </td>
                                        <td>
                                            <div className={s.actions}>
                                                {(admin.id !== user?.id && admin?.role !== 'superadmin') && (
                                                    <>
                                                        <button className={s.toggleBtn} onClick={() => handleToggleActive(admin)}>
                                                            {admin.is_active ? '🔒' : '🔓'}
                                                        </button>
                                                        <button className={s.deleteBtn} onClick={() => setShowDeleteConfirm(admin.id)}>
                                                            🗑️
                                                        </button>
                                                    </>
                                                )}
                                                {admin.id === user?.id && (
                                                    <span className={s.currentUser}>Вы</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Логи */}
            <div className={s.logsSection}>
                <h3>История действий</h3>

                <div className={s.filters}>
                    <select
                        value={filters.admin_id}
                        onChange={(e) => setFilters({ ...filters, admin_id: Number(e.target.value), page: 1 })}
                    >
                        <option value={0}>Все администраторы</option>
                        {admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                                {admin.name} ({admin.email})
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                    >
                        <option value="">Все действия</option>
                        {Object.entries(actionLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    <DatePicker
                        value={filters.date_from}
                        onChange={handleDateFromChange}
                        placeholder="С даты"
                    />

                    <DatePicker
                        value={filters.date_to}
                        onChange={handleDateToChange}
                        placeholder="По дату"
                    />
                </div>

                {/* Мобильные карточки логов */}
                {isMobile ? (
                    <div className={s.logCards}>
                        {logs.map((log: any) => (
                            <div key={log.id} className={s.logCard}>
                                <div className={s.logCardHeader}>
                                    <span className={`${s.actionBadge} ${s[log.action] || ''}`}>
                                        {actionLabels[log.action] || log.action}
                                    </span>
                                    <span className={s.logTime}>
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className={s.logCardBody}>
                                    <div className={s.logCardRow}>
                                        <span>Админ:</span>
                                        <span>{log.admin_name} ({log.admin_email})</span>
                                    </div>
                                    {log.entity_type && (
                                        <div className={s.logCardRow}>
                                            <span>Объект:</span>
                                            <span>{log.entity_type} #{log.entity_id}</span>
                                        </div>
                                    )}
                                    {log.details && (
                                        <div className={s.logCardDetails}>
                                            {log.details}
                                        </div>
                                    )}
                                    {log.ip_address && (
                                        <div className={s.logCardRow}>
                                            <span>IP:</span>
                                            <span>{log.ip_address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className={s.empty}>Нет записей</div>
                        )}
                    </div>
                ) : (
                    /* Десктопная таблица логов */
                    <table className={s.table}>
                        <thead>
                            <tr>
                                <th>Время</th>
                                <th>Администратор</th>
                                <th>Действие</th>
                                <th>Тип объекта</th>
                                <th>ID объекта</th>
                                <th>Детали</th>
                                <th>IP адрес</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log: any) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.created_at).toLocaleString()}</td>
                                    <td>
                                        {log.admin_name}<br />
                                        <small>{log.admin_email}</small>
                                    </td>
                                    <td>
                                        <span className={`${s.actionBadge} ${s[log.action] || ''}`}>
                                            {actionLabels[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td>{log.entity_type || '—'}</td>
                                    <td>{log.entity_id || '—'}</td>
                                    <td className={s.details}>{log.details || '—'}</td>
                                    <td>{log.ip_address || '—'}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={s.empty}>Нет записей</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Модальное окно приглашения */}
            {showInviteModal && (
                <div className={s.modal}>
                    <div className={s.modalContent}>
                        <h3>Пригласить администратора</h3>

                        <div className={s.formGroup}>
                            <label>Email:</label>
                            <input
                                type="email"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                placeholder="admin@example.com"
                            />
                        </div>

                        <div className={s.formGroup}>
                            <label>Роль:</label>
                            <select
                                value={inviteForm.role}
                                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'superadmin' })}
                            >
                                <option value="admin">Администратор</option>
                                <option value="superadmin">Суперадмин</option>
                            </select>
                        </div>

                        <div className={s.modalActions}>
                            <button className={s.cancelBtn} onClick={() => setShowInviteModal(false)}>
                                Отмена
                            </button>
                            <button className={s.submitBtn} onClick={handleInvite}>
                                Отправить приглашение
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            {showDeleteConfirm && (
                <div className={s.modal}>
                    <div className={s.modalContent}>
                        <h3>Подтверждение удаления</h3>
                        <p>Вы уверены, что хотите удалить этого администратора?</p>
                        <p className={s.warning}>Это действие нельзя отменить!</p>

                        <div className={s.modalActions}>
                            <button className={s.cancelBtn} onClick={() => setShowDeleteConfirm(null)}>
                                Отмена
                            </button>
                            <button className={s.deleteConfirmBtn} onClick={() => handleDeleteAdmin(showDeleteConfirm)}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLogs;