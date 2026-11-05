// components/alphabetNavigation/AlphabetNavigationList.tsx
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import s from './AlphabetNavigationList.module.css';
import Scroller from '../scroller/Scroller';
import { useAppSelector } from 'src/store/hooks/redux';

interface IAlphabetNavigationListProps {
    onChange?: (slug: string) => void;
}

const AlphabetNavigationList: React.FC<IAlphabetNavigationListProps> = ({
    onChange,
}) => {
    const router = useRouter();
    const { firmMap } = useAppSelector(state => state.menu);

    const alphabet = useMemo(() => {
        const firms = Object.values(firmMap);
        const grouped: Record<string, { name: string; slug: string }[]> = {};

        firms.forEach((firm) => {
            const firstChar = firm.name.charAt(0).toUpperCase();
            const key = /[0-9]/.test(firstChar) ? '0-9' : firstChar;

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push({ name: firm.name, slug: firm.slug });
        });

        Object.values(grouped).forEach((arr) =>
            arr.sort((a, b) => a.name.localeCompare(b.name))
        );

        return grouped;
    }, [firmMap]);

    const letters = useMemo(() => {
        return Object.keys(alphabet).sort((a, b) => {
            if (a === '0-9') return -1;
            if (b === '0-9') return 1;
            return a.localeCompare(b);
        });
    }, [alphabet]);

    const [activeLetter, setActiveLetter] = useState<string>(
        letters.length > 0 ? letters[0] : ''
    );

    useEffect(() => {
        if (letters.length > 0 && !letters.includes(activeLetter)) {
            setActiveLetter(letters[0]);
        }
    }, [letters, activeLetter]);

    const handleLetterClick = useCallback((letter: string) => {
        setActiveLetter(letter);
    }, []);

    const handleBrandClick = useCallback(
        (slug: string) => {
            onChange?.(slug);
        },
        [onChange]
    );

    const activeFirms = activeLetter ? alphabet[activeLetter] || [] : [];

    return (
        <div className={s.wrapper}>
            {/* ===== Левая часть: буквы сеткой ===== */}
            <div className={s.letterColumn}>
                <Scroller onlyVertical={true}>
                    <div className={s.letterGrid}>
                        {letters.map((letter) => (
                            <button
                                key={letter}
                                type="button"
                                className={`${s.letterBtn} ${activeLetter === letter ? s.letterBtnActive : ''
                                    }`}
                                onClick={() => handleLetterClick(letter)}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </Scroller>
            </div>

            {/* ===== Правая часть: заголовок + сетка фирм ===== */}
            <div className={s.firmColumn}>
                {activeLetter && (
                    <div className={s.firmHeader}>{activeLetter}</div>
                )}

                <div className={s.firmScroll}>
                    <Scroller onlyVertical={true}>
                        {activeFirms.length === 0 ? (
                            <div className={s.empty}>Нет фирм на эту букву</div>
                        ) : (
                            <div className={s.firmGrid}>
                                {activeFirms.map((firm) => (
                                    <button
                                        key={firm.slug}
                                        type="button"
                                        className={s.firmItem}
                                        onClick={() => handleBrandClick(firm.slug)}
                                    >
                                        {firm.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Scroller>
                </div>
            </div>
        </div>
    );
};

export default memo(AlphabetNavigationList);