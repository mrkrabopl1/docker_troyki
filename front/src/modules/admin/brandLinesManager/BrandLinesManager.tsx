// src/components/admin/BrandLinesManager/BrandLinesManager.tsx
import React, { useState } from 'react';
// import { ReactComponent as EditIcon } from '/public/edit.svg';
// import { ReactComponent as EyeIcon } from '/public/eye.svg';
// import { ReactComponent as EyeOffIcon } from '/public/eye-off.svg';
// import { ReactComponent as DeleteIcon } from '/public/delete.svg';
// import { ReactComponent as MoveIcon } from '/public/move.svg';
import s from './style.module.css';

export interface LineData {
  id?: number;
  name: string;
  description?: string;
  season?: string;
  year?: number;
  image_path?: string;
  is_active?: boolean;
  sort_order?: number;
  total_products?: number;
  active_products?: number;
  inactive_products?: number;
}

interface BrandLinesManagerProps {
  lines: LineData[];
  mode: 'manage'; // только manage режим
  loading?: boolean;
  showStats?: boolean;
  onEditLine?: (line: LineData) => void;
  onDeleteLine?: (line: LineData) => Promise<void>;
  onToggleActive?: (line: LineData) => Promise<void>;
  onSortOrderChange?: (lineId: number, newOrder: number) => Promise<void>;
}

type SortField = 'name' | 'sort_order' | 'products';

const BrandLinesManager: React.FC<BrandLinesManagerProps> = ({
  lines,
  loading = false,
  showStats = false,
  onEditLine,
  onDeleteLine,
  onToggleActive,
  onSortOrderChange
}) => {
  const [sortField, setSortField] = useState<SortField>('sort_order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [draggedLine, setDraggedLine] = useState<LineData | null>(null);
  const [updatingLineId, setUpdatingLineId] = useState<number | null>(null);

  const getSeasonName = (season: string): string => {
    const seasons: Record<string, string> = {
      'spring': 'Весна',
      'summer': 'Лето',
      'autumn': 'Осень',
      'winter': 'Зима',
      'spring-summer': 'Весна-Лето',
      'autumn-winter': 'Осень-Зима'
    };
    return seasons[season] || season;
  };

  // Сортировка
  const sortedLines = [...lines].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'name') {
      return direction * a.name.localeCompare(b.name);
    }
    if (sortField === 'sort_order') {
      return direction * ((a.sort_order || 0) - (b.sort_order || 0));
    }
    if (sortField === 'products') {
      return direction * ((a.total_products || 0) - (b.total_products || 0));
    }
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Drag & Drop
  const handleDragStart = (line: LineData) => {
    setDraggedLine(line);
  };

  const handleDragOver = (e: React.DragEvent, targetLine: LineData) => {
    e.preventDefault();
    if (!draggedLine || draggedLine.id === targetLine.id) return;
    
    const row = e.currentTarget as HTMLElement;
    const rect = row.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Убираем классы у всех строк
    document.querySelectorAll(`.${s.lineRow}`).forEach(r => {
      r.classList.remove(s.dropAbove, s.dropBelow);
    });
    
    if (y < rect.height / 2) {
      row.classList.add(s.dropAbove);
    } else {
      row.classList.add(s.dropBelow);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const row = e.currentTarget as HTMLElement;
    row.classList.remove(s.dropAbove, s.dropBelow);
  };

  const handleDrop = async (e: React.DragEvent, targetLine: LineData) => {
    e.preventDefault();
    const row = e.currentTarget as HTMLElement;
    row.classList.remove(s.dropAbove, s.dropBelow);
    
    if (!draggedLine || !draggedLine.id || draggedLine.id === targetLine.id || !onSortOrderChange) {
      setDraggedLine(null);
      return;
    }
    
    const rect = row.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const insertBefore = y < rect.height / 2;
    
    const targetIndex = sortedLines.findIndex(l => l.id === targetLine.id);
    let newSortOrder: number;
    
    if (insertBefore) {
      // Вставляем перед целевой линейкой
      const prevLine = targetIndex > 0 ? sortedLines[targetIndex - 1] : null;
      if (prevLine && prevLine.sort_order !== undefined) {
        newSortOrder = Math.floor(((targetLine.sort_order || 0) + (prevLine.sort_order || 0)) / 2);
      } else {
        newSortOrder = (targetLine.sort_order || 0) - 1;
      }
    } else {
      // Вставляем после целевой линейки
      const nextLine = targetIndex < sortedLines.length - 1 ? sortedLines[targetIndex + 1] : null;
      if (nextLine && nextLine.sort_order !== undefined) {
        newSortOrder = Math.floor(((targetLine.sort_order || 0) + (nextLine.sort_order || 0)) / 2);
      } else {
        newSortOrder = (targetLine.sort_order || 0) + 1;
      }
    }
    
    try {
      await onSortOrderChange(draggedLine.id, newSortOrder);
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
    
    setDraggedLine(null);
  };

  const handleDragEnd = () => {
    setDraggedLine(null);
    document.querySelectorAll(`.${s.lineRow}`).forEach(row => {
      row.classList.remove(s.dropAbove, s.dropBelow);
    });
  };

  // Обработчики действий
  const handleToggleActive = async (line: LineData) => {
    if (!line.id || !onToggleActive) return;
    
    setUpdatingLineId(line.id);
    try {
      await onToggleActive(line);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleDelete = async (line: LineData) => {
    if (!onDeleteLine) return;
    
    setUpdatingLineId(line.id!);
    try {
      await onDeleteLine(line);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const handleSortOrderChange = async (line: LineData, newOrder: number) => {
    if (!line.id || !onSortOrderChange || isNaN(newOrder)) return;
    
    setUpdatingLineId(line.id);
    try {
      await onSortOrderChange(line.id, newOrder);
    } finally {
      setUpdatingLineId(null);
    }
  };

  const SortableHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      className={s.sortableHeader} 
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (
        <span className={s.sortIndicator}>
          {sortDirection === 'asc' ? ' ↑' : ' ↓'}
        </span>
      )}
    </th>
  );

  if (loading) {
    return (
      <div className={s.loadingWrapper}>
        <div className={s.loading}>Загрузка линеек...</div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className={s.empty}>
        <p>Нет добавленных линеек</p>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <table className={s.linesTable}>
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th style={{ width: 60 }}>Изобр.</th>
            <SortableHeader field="name">Название</SortableHeader>
            <th>Сезон</th>
            <th>Год</th>
            {showStats && (
              <SortableHeader field="products">Товары</SortableHeader>
            )}
            <SortableHeader field="sort_order">Порядок</SortableHeader>
            <th>Статус</th>
            <th style={{ width: 100 }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedLines.map(line => (
            <tr
              key={line.id || line.name}
              className={`
                ${s.lineRow} 
                ${!line.is_active ? s.inactive : ''} 
                ${draggedLine?.id === line.id ? s.dragging : ''}
                ${updatingLineId === line.id ? s.updating : ''}
              `}
              draggable={sortField === 'sort_order' && !updatingLineId}
              onDragStart={() => handleDragStart(line)}
              onDragOver={(e) => handleDragOver(e, line)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, line)}
              onDragEnd={handleDragEnd}
            >
              <td className={s.dragHandle}>
                {/* {sortField === 'sort_order' && <MoveIcon />} */}
              </td>
              
              <td className={s.imageCell}>
                {line.image_path ? (
                  <img src={line.image_path} alt={line.name} />
                ) : (
                  <div className={s.noImage}>—</div>
                )}
              </td>
              
              <td className={s.nameCell}>
                <div className={s.lineName}>{line.name}</div>
                {line.description && (
                  <div className={s.lineDescription}>{line.description}</div>
                )}
              </td>
              
              <td className={s.seasonCell}>
                {line.season ? getSeasonName(line.season) : '—'}
              </td>
              
              <td className={s.yearCell}>
                {line.year || '—'}
              </td>
              
              {showStats && (
                <td className={s.productsCell}>
                  <div className={s.productStats}>
                    <span className={s.totalProducts}>{line.total_products || 0}</span>
                    <div className={s.productBreakdown}>
                      <span className={s.activeProducts}>{line.active_products || 0}</span>
                      <span className={s.separator}>/</span>
                      <span className={s.inactiveProducts}>{line.inactive_products || 0}</span>
                    </div>
                  </div>
                </td>
              )}
              
              <td className={s.sortOrderCell}>
                <input
                  type="number"
                  value={line.sort_order || 0}
                  onChange={(e) => handleSortOrderChange(line, parseInt(e.target.value))}
                  className={s.sortOrderInput}
                  min="0"
                  disabled={updatingLineId === line.id}
                />
              </td>
              
              <td className={s.statusCell}>
                <button
                  className={`${s.statusToggle} ${line.is_active ? s.active : s.inactive}`}
                  onClick={() => handleToggleActive(line)}
                  disabled={updatingLineId === line.id || !onToggleActive}
                  title={line.is_active ? 'Активна' : 'Неактивна'}
                >
                  {/* {line.is_active ? <EyeIcon /> : <EyeOffIcon />} */}
                </button>
              </td>
              
              <td className={s.actionsCell}>
                <button
                  className={s.actionBtn}
                  onClick={() => onEditLine?.(line)}
                  disabled={updatingLineId === line.id}
                  title="Редактировать"
                >
                  {/* <EditIcon /> */}
                </button>
                <button
                  className={`${s.actionBtn} ${s.deleteBtn}`}
                  onClick={() => handleDelete(line)}
                  disabled={updatingLineId === line.id}
                  title="Удалить"
                >
                  {/* <DeleteIcon /> */}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BrandLinesManager;