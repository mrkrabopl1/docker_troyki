// pages/admin/ProductVisibility/AdminMerchBlock.tsx
import React, { useState } from 'react'
import { useRouter } from 'next/router';
import { toPrice } from 'src/global';
import s from './adminMerchBlock.module.css'

interface AdminMerchBlockProps {
    data: any
    isSelected: boolean
    onSelect: () => void
    onStatusToggle: (isActive: boolean) => void
}

const AdminMerchBlock: React.FC<AdminMerchBlockProps> = ({ 
    data, 
    isSelected, 
    onSelect, 
    onStatusToggle 
}) => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div 
            className={`${s.merchBlock} ${!data.is_active ? s.inactive : ''} ${isSelected ? s.selected : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={s.checkboxContainer}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            
            <div className={s.imageBlock} onClick={() => router.push('/products/edit/' + data.id)}>
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
                <div className={`${s.statusBadge} ${data.is_active ? s.active : s.inactive}`}>
                    {data.is_active ? 'На витрине' : 'Скрыт'}
                </div>
                
                {isHovered && (
                    <button
                        className={`${s.toggleBtn} ${data.is_active ? s.hideBtn : s.showBtn}`}
                        onClick={() => onStatusToggle(!data.is_active)}
                    >
                        {data.is_active ? '👁️‍🗨️ Скрыть' : '👁️ Показать'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default AdminMerchBlock