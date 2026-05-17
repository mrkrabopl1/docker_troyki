import React, { useEffect, useState } from 'react';
import { getLogs, getAdmins } from 'src/providers/adminProvider';
import s from './style.module.css';

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        admin_id: 0,
        action: '',
        date_from: '',
        date_to: ''
    });

    useEffect(() => {
        loadAdmins();
        loadLogs();
    }, [filters]);

    const loadAdmins = async () => {
        const data = await getAdmins({ page: 1, limit: 100 });
        setAdmins(data.admins);
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getLogs(filters);
            setLogs(data.logs);
        } finally {
            setLoading(false);
        }
    };

    const actionLabels: Record<string, string> = {
        'create': 'Создание',
        'update': 'Обновление',
        'delete': 'Удаление',
        'update_status': 'Изменение статуса',
        'login': 'Вход',
        'logout': 'Выход'
    };

    return (
        <div className={s.container}>
            <h2>Логи администраторов</h2>
            
            <div className={s.filters}>
                <select
                    value={filters.admin_id}
                    onChange={(e) => setFilters({ ...filters, admin_id: Number(e.target.value), page: 1 })}
                >
                    <option value="">Все администраторы</option>
                    {admins.map((admin: any) => (
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
                    <option value="create">Создание</option>
                    <option value="update">Обновление</option>
                    <option value="delete">Удаление</option>
                    <option value="update_status">Изменение статуса</option>
                </select>
                
                <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
                    placeholder="С даты"
                />
                
                <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
                    placeholder="По дату"
                />
            </div>

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
                                {log.admin_name}<br/>
                                <small>{log.admin_email}</small>
                            </td>
                            <td>{actionLabels[log.action] || log.action}</td>
                            <td>{log.entity_type || '—'}</td>
                            <td>{log.entity_id || '—'}</td>
                            <td>{log.details || '—'}</td>
                            <td>{log.ip_address || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminLogs;