import React, { useEffect, useState, useCallback, memo } from 'react';
import { getMyPromoCodes, type PromoCode } from 'src/providers/userProvider';
import s from './promoTab.module.css';

function formatDiscount(promo: PromoCode): string {
    if (promo.discount_type === 'percent') {
        return `${promo.discount_value / 100}%`;
    }
    return `${(promo.discount_value / 100).toFixed(0)} ₽`;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

const PromoTab: React.FC = () => {
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await getMyPromoCodes();
                if (!cancelled) setPromos(data);
            } catch (err) {
                console.warn('[PromoTab]', err);
                if (!cancelled) setPromos([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    const handleCopy = useCallback(async (promo: PromoCode) => {
        try {
            await navigator.clipboard.writeText(promo.code);
            setCopiedId(promo.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.warn('[PromoTab] copy failed:', err);
        }
    }, []);

    if (loading) {
        return <div className={s.loading}>Загрузка промокодов...</div>;
    }

    if (!promos.length) {
        return (
            <div className={s.empty}>
                У вас пока нет персональных промокодов.
                <br />
                Следите за акциями — мы дарим скидки за регистрацию и в честь праздников.
            </div>
        );
    }

    return (
        <div className={s.list}>
            {promos.map(promo => {
                const isCopied = copiedId === promo.id;

                return (
                    <div key={promo.id} className={s.item}>
                        <div className={s.itemHeader}>
                            <div className={s.discount}>
                                {formatDiscount(promo)}
                            </div>
                            <div className={s.personalBadge}>Персональный</div>
                        </div>

                        <div
                            className={s.code}
                            onClick={() => handleCopy(promo)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleCopy(promo);
                                }
                            }}
                        >
                            {promo.code}
                        </div>

                        <div className={s.copyHint}>
                            {isCopied ? '✓ Скопировано' : 'Нажмите, чтобы скопировать'}
                        </div>

                        {promo.name && (
                            <div className={s.name}>{promo.name}</div>
                        )}

                        {promo.description && (
                            <div className={s.description}>{promo.description}</div>
                        )}

                        <div className={s.meta}>
                            {promo.min_order && promo.min_order > 0 && (
                                <div className={s.metaRow}>
                                    Мин. заказ: {(promo.min_order / 100).toFixed(0)} ₽
                                </div>
                            )}
                            {promo.max_discount && promo.max_discount > 0 && (
                                <div className={s.metaRow}>
                                    Макс. скидка: {(promo.max_discount / 100).toFixed(0)} ₽
                                </div>
                            )}
                            {promo.applies_to === 'collection' && promo.collection_name && (
                                <div className={s.metaRow}>
                                    Коллекция: {promo.collection_name}
                                </div>
                            )}
                            {promo.ends_at && (
                                <div className={s.metaRow}>
                                    Действует до: {formatDate(promo.ends_at)}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default memo(PromoTab);