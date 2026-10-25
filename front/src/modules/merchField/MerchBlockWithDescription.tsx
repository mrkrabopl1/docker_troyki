import React, { memo } from 'react';
import { useNavigate } from 'src/store/hooks/redux';
import { toPrice } from 'src/global';
import s from './merchBlockWithDescription.module.css';

export interface MerchBlockWithDescriptionData {
    id: number | string;
    name: string;
    image_path: string;
    firm?: string;
    price?: number;
    discount?: number;
    discount_percent?: number;
    description?: string;
    year?: number;
}

interface Props {
    data: MerchBlockWithDescriptionData;
}

const MerchBlockWithDescription: React.FC<Props> = memo(({ data }) => {
    const navigate = useNavigate();

    const hasDiscount = (data.discount_percent ?? 0) > 0 && (data.discount ?? 0) > 0;

    return (
        <div
            className={s.block}
            onClick={() => navigate('/product/' + data.id)}
            role="button"
            tabIndex={0}
        >
            <div className={s.imageWrap}>
                {data.image_path ? (
                    <img className={s.image} src={data.image_path} alt={data.name} />
                ) : (
                    <div className={s.imagePlaceholder} />
                )}
            </div>

            <div className={s.content}>
                <div className={s.topRow}>
                    {data.firm && <span className={s.firm}>{data.firm}</span>}
                    {data.year ? (
                        <span className={s.year} title="Год релиза">{data.year}</span>
                    ) : null}
                </div>

                <h3 className={s.name}>{data.name}</h3>

                {data.description && (
                    <p className={s.description}>{data.description}</p>
                )}

                {typeof data.price === 'number' && data.price > 0 && (
                    <div className={s.priceRow}>
                        {hasDiscount ? (
                            <>
                                <span className={s.oldPrice}>{toPrice(data.price)}</span>
                                <span className={s.discountPercent}>-{data.discount_percent}%</span>
                                <span className={s.price}>{toPrice(data.discount!)}</span>
                            </>
                        ) : (
                            <span className={s.price}>{toPrice(data.price)}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

MerchBlockWithDescription.displayName = 'MerchBlockWithDescription';

export default MerchBlockWithDescription;