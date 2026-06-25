// modules/merchField/AdminMerchBlockGrid.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toPrice } from 'src/global';
import Checkbox from 'src/components/checkbox/Checkbox'; // ваш компонент
import s from './adminMerchBlockGrid.module.css';

interface AdminMerchBlockGridProps {
    data: any;
    isSelected?: boolean;        // внешнее управление (опционально)
    onSelect?: (selected: boolean) => void;  // внешний колбэк
    onStatusToggle: (isActive: boolean) => void;
}

const AdminMerchBlockGrid: React.FC<AdminMerchBlockGridProps> = ({ 
    data, 
    isSelected: externalSelected,
    onSelect,
    onStatusToggle 
}) => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [internalSelected, setInternalSelected] = useState(false);
    
    // Используем либо внешнее состояние, либо внутреннее
    const isSelected = externalSelected !== undefined ? externalSelected : internalSelected;

    const handleSelect = useCallback((selected: boolean) => {
        if (externalSelected !== undefined) {
            onSelect?.(selected); // внешний контроль
        } else {
            setInternalSelected(selected); // внутренний контроль
        }
    }, [externalSelected, onSelect]);

    return (
        <div 
            className={`${s.merchBlock} ${data.status !== "active" ? s.inactive : ''} ${isSelected ? s.selected : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Чекбокс - инкапсулированный компонент */}
            <div className={s.checkboxContainer}>
                <Checkbox
                    enable={true}
                    activeData={isSelected}
                    onChange={handleSelect}
                />
            </div>
            
            <div className={s.imageBlock} onClick={() => router.push('/admin/products/edit/' + data.id)}>
                <img src={data.imgs?.[0] || data.image_path} alt={data.name} />
                {data.discount && (
                    <div className={s.discountBadge}>
                        -{Math.round((data.price - data.discount) / data.price * 100)}%
                    </div>
                )}
            </div>
            
            <div className={s.infoBlock}>
                <div className={s.name}>{data.name}</div>
                <div className={s.firm}>{data.firm}</div>
                <div className={s.price}>
                    {data.discount ? (
                        <>
                            <span className={s.oldPrice}>{toPrice(data.price)}</span>
                            <span className={s.newPrice}>{toPrice(data.discount)}</span>
                        </>
                    ) : (
                        <span>{toPrice(data.price)}</span>
                    )}
                </div>
            </div>
            
            <div className={s.statusBlock}>
                <div className={`${s.statusBadge} ${data.status === "active" ? s.active : s.inactive}`}>
                    {data.status === "active" ? 'На витрине' : 'Скрыт'}
                </div>
                
                {isHovered && (
                    <button
                        className={`${s.toggleBtn} ${data.status === "active" ? s.hideBtn : s.showBtn}`}
                        onClick={() => onStatusToggle(data.status !== "active")}
                    >
                        {data.status === "active" ? 'Скрыть' : 'Показать'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(AdminMerchBlockGrid);