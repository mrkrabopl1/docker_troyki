import React, { memo, useCallback, useEffect, useRef, useMemo } from 'react';
import s from "./style.module.css"
import Scroller from '../scroller/Scroller';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';

interface IAlphabetNavigationProps {
    names?: string[];
    onChange?: (name: string) => void;
}

const AlphabetNavigation: React.FC<IAlphabetNavigationProps> = ({
    onChange,
    names,
}) => {
    const { firms } = useAppSelector(state => state.menuReducer);
    
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

        return Object.entries(alphabet).map(([key, value]) => {
            return (
                <div className={s.alphabetTable} key={key}>
                    <div className={s.alphabetKey}>{key}</div>
                    <div>
                        {value.map((name, index) => (
                            <div 
                                className={s.alphabetName} 
                                onClick={() => onChange?.(name)} 
                                key={`${key}-${index}`}
                            >
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    }, [firms, onChange]);

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