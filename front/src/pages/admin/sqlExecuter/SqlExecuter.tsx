// pages/admin/SQLConsole/SQLConsole.tsx
import React, { useState } from 'react';
import Button from 'src/components/Button';
import { sqlExecute } from 'src/providers/adminProvider';

const SQLConsole: React.FC = () => {
    const [sql, setSql] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const executeSQL = async () => {
        if (!sql.trim()) return;
        setLoading(true);
        try {
            const res = await sqlExecute({query:sql})
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2>SQL Консоль</h2>
            
            <textarea
                value={sql}
                onChange={e => setSql(e.target.value)}
                rows={15}
                style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    resize: 'vertical'
                }}
                placeholder="Вставьте SQL..."
            />
            
            <Button
                text={loading ? 'Выполнение...' : 'Выполнить'}
                onClick={executeSQL}
            />
            
            {result && (
                <pre style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '12px',
                    maxHeight: '500px'
                }}>
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
};

export default SQLConsole;