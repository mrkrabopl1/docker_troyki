// pages/admin/SQLConsole/SQLConsole.tsx
import React, { useEffect, useState } from 'react';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';
import { sqlExecute } from 'src/providers/adminProvider';
import styles from './style.module.css';

interface SQLOperation {
  type: string;
  table: string;
  status: string;
  rows_affected?: number;
  message?: string;
}

interface SQLSummary {
  total_queries: number;
  successful: number;
  failed: number;
  skipped: number;
  tablesAffected: Record<string, number>;
  operations_by_type: Record<string, number>;
}

interface SQLValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mode: string;
}

interface SQLResponse {
  success: boolean;
  validation: SQLValidation;
  operations: SQLOperation[];
  summary: SQLSummary;
  error?: string;
  total_time: string;
}

const SQLConsole: React.FC = () => {
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<SQLResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(finishLoading());
    }, 0);
    return () => {
      clearTimeout(timeout);
    };
  }, [dispatch]);

  const executeSQL = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    setResult(null);
    
    try {
      // sqlExecute уже возвращает готовый объект, не Response
      const data = await sqlExecute({ query: sql });
      setResult(data);
    } catch (err) {
      console.error('SQL Execute Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOperationBadgeClass = (type: string): string => {
    const map: Record<string, string> = {
      'SELECT': styles.badgeSelect,
      'INSERT': styles.badgeInsert,
      'UPDATE': styles.badgeUpdate,
      'DELETE': styles.badgeDelete,
      'CREATE': styles.badgeCreate,
      'ALTER': styles.badgeAlter,
      'DROP': styles.badgeDrop,
      'TRUNCATE': styles.badgeTruncate,
      'BEGIN': styles.badgeBegin,
      'COMMIT': styles.badgeCommit,
    };
    return map[type] || styles.badgeOther;
  };

  const getStatusBadgeClass = (status: string): string => {
    const map: Record<string, string> = {
      'success': styles.statusSuccess,
      'error': styles.statusError,
      'skipped': styles.statusSkipped,
    };
    return map[status] || '';
  };

  const getStatusIcon = (status: string): string => {
    const map: Record<string, string> = {
      'success': '✅',
      'error': '❌',
      'skipped': '⏭️',
    };
    return map[status] || '📋';
  };

  const getSummaryStatusClass = (summary: SQLSummary): string => {
    if (summary.failed === 0 && summary.total_queries > 0) return styles.summaryStatusSuccess;
    if (summary.failed > 0 && summary.successful > 0) return styles.summaryStatusPartial;
    if (summary.failed > 0) return styles.summaryStatusError;
    return styles.summaryStatusSuccess;
  };

  const getSummaryStatusText = (summary: SQLSummary): string => {
    if (summary.failed === 0 && summary.total_queries > 0) return '✅ Успешно';
    if (summary.failed > 0 && summary.successful > 0) return '⚠️ Частично';
    if (summary.failed > 0) return '❌ Ошибка';
    return '📋 Нет данных';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          SQL <span>Консоль</span>
        </h1>
      </div>

      <div className={styles.querySection}>
        <textarea
          className={styles.textarea}
          value={sql}
          onChange={e => setSql(e.target.value)}
          rows={12}
          placeholder="Вставьте SQL запросы здесь..."
        />

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <span className={styles.stats}>
              📝 {sql.split(';').filter(q => q.trim()).length} запросов
            </span>
            <span className={styles.stats}>
              📏 {sql.length} символов
            </span>
          </div>
          <div className={styles.toolbarRight}>
            <button
              className={`${styles.executeButton} ${styles.executeButtonPrimary}`}
              onClick={executeSQL}
              disabled={loading || !sql.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Выполнение...
                </>
              ) : (
                '▶️ Выполнить'
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className={styles.results}>
          {/* Сводка */}
          <div className={styles.summary}>
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>📊 Сводка выполнения</h2>
              <span className={`${styles.summaryStatus} ${getSummaryStatusClass(result.summary)}`}>
                {getSummaryStatusText(result.summary)}
              </span>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemLabel}>Всего запросов</div>
                <div className={styles.summaryItemValue}>{result.summary.total_queries}</div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemLabel}>✅ Успешно</div>
                <div className={`${styles.summaryItemValue} ${styles.success}`}>
                  {result.summary.successful}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemLabel}>❌ Ошибок</div>
                <div className={`${styles.summaryItemValue} ${styles.error}`}>
                  {result.summary.failed}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemLabel}>⏭️ Пропущено</div>
                <div className={`${styles.summaryItemValue} ${styles.skipped}`}>
                  {result.summary.skipped}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemLabel}>⏱️ Время</div>
                <div className={`${styles.summaryItemValue} ${styles.time}`}>
                  {result.total_time}
                </div>
              </div>
            </div>

            {Object.keys(result.summary.tablesAffected).length > 0 && (
              <div className={styles.summaryTables}>
                <div className={styles.summaryTablesTitle}>
                  📋 Затронутые таблицы:
                </div>
                <div className={styles.summaryTablesGrid}>
                  {Object.entries(result.summary.tablesAffected).map(([table, count]) => (
                    <span key={table} className={styles.summaryTableTag}>
                      {table}: <strong>{count}</strong> операций
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Детали операций с ошибками */}
          {result.operations && result.operations.length > 0 && (
            <div className={styles.operations}>
              <div className={styles.operationsHeader}>
                <h2 className={styles.operationsTitle}>📋 Детали операций</h2>
                <span className={styles.stats}>
                  {result.operations.length} операций
                </span>
              </div>

              {result.operations.map((op, index) => {
                const hasError = op.status === 'error';
                
                return (
                  <div 
                    key={index} 
                    className={`${styles.operationItem} ${hasError ? styles.operationError : ''}`}
                  >
                    <span className={styles.operationIndex}>#{index + 1}</span>
                    
                    <span className={`${styles.operationBadge} ${getOperationBadgeClass(op.type)}`}>
                      {op.type}
                    </span>
                    
                    <span className={`${styles.operationStatus} ${getStatusBadgeClass(op.status)}`}>
                      {getStatusIcon(op.status)} {op.status}
                    </span>
                    
                    <span className={styles.operationTable}>
                      {op.table || '—'}
                    </span>
                    
                    {op.rows_affected !== undefined && !hasError && (
                      <span className={styles.operationRows}>
                        {op.rows_affected} строк
                      </span>
                    )}

                    {/* ПОКАЗЫВАЕМ MESSAGE С ОШИБКОЙ */}
                    {hasError && op.message && (
                      <div className={styles.operationErrorDetails}>
                        <div className={styles.errorLabel}>❌ Ошибка:</div>
                        <div className={styles.errorMessageFull}>
                          {op.message}
                        </div>
                      </div>
                    )}

                    {!hasError && op.message && (
                      <span className={styles.operationMessage}>
                        {op.message}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ошибки валидации */}
          {result.validation.errors && result.validation.errors.length > 0 && (
            <div className={styles.errors}>
              <div className={styles.errorsTitle}>
                ❌ Ошибки валидации ({result.validation.errors.length})
              </div>
              <ul className={styles.errorsList}>
                {result.validation.errors.map((err, i) => (
                  <li key={i}>
                    <span className={styles.errorNumber}>#{i + 1}</span>
                    <span className={styles.errorText}>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Предупреждения */}
          {result.validation.warnings && result.validation.warnings.length > 0 && (
            <div className={styles.warnings}>
              <div className={styles.warningsTitle}>
                ⚠️ Предупреждения ({result.validation.warnings.length})
              </div>
              <ul className={styles.warningsList}>
                {result.validation.warnings.map((warn, i) => (
                  <li key={i}>
                    <span className={styles.warningNumber}>#{i + 1}</span>
                    <span className={styles.warningText}>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Общая ошибка */}
          {result.error && (
            <div className={styles.errors} style={{ marginTop: '16px' }}>
              <div className={styles.errorsTitle}>❌ Ошибка выполнения</div>
              <ul className={styles.errorsList}>
                <li>
                  <span className={styles.errorText}>{result.error}</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SQLConsole;