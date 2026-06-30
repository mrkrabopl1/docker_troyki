import React, { memo, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import s from "./style.module.css"
import Scroller from '../scroller/Scroller';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';

interface IAlphabetNavigationProps {
    onChange?: (slug: string) => void;
}

const AlphabetNavigation: React.FC<IAlphabetNavigationProps> = ({
    onChange,
}) => {
    const router = useRouter();
    const { firmMap } = useAppSelector(state => state.menuReducer);
    
    // Получаем список фирм из firmMap
    const firms = useMemo(() => {
        return Object.values(firmMap).map(firm => firm.name).sort();
    }, [firmMap]);

    // Создаем алфавитный список
    const createAlphabetItems = useMemo(() => {
        const sortedFirms = [...firms].sort();
        
        const alphabet: Record<string, string[]> = {};
        
        sortedFirms.forEach(name => {
            let firstChar = name.charAt(0).toUpperCase();
            if (/[0-9]/.test(firstChar)) {
                firstChar = '0-9';
            }
            if (!alphabet[firstChar]) {
                alphabet[firstChar] = [];
            }
            alphabet[firstChar].push(name);
        });

        // Функция перехода на страницу бренда
        const handleBrandClick = (name: string) => {
            // Находим фирму по имени
            const firm = Object.values(firmMap).find(f => f.name === name);
            if (firm) {
               onChange?.(firm.slug)
            }
        };

        return Object.entries(alphabet).map(([key, value]) => {
            return (
                <div className={s.alphabetTable} key={key}>
                    <div className={s.alphabetKey}>{key}</div>
                    <div>
                        {value.map((name, index) => (
                            <div 
                                className={s.alphabetName} 
                                onClick={() => handleBrandClick(name)} 
                                key={`${key}-${index}`}
                            >
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    }, [firms, firmMap, router, onChange]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Scroller>
                <div className={s.alphabetContainer} style={{ width: '100%', height: '100%', display: 'flex' }}>
                    {createAlphabetItems}
                </div>
            </Scroller>
        </div>
    );
};

export default memo(AlphabetNavigation);