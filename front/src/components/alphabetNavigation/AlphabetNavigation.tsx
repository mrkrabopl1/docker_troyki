import React, { memo, useCallback, useEffect, useRef, useMemo } from 'react';
import s from "./style.module.css"
import Scroller from '../scroller/Scroller';

interface IAlphabetNavigationProps {
    names: string[];
    onChange?: (name: string) => void;
}


const AlphabetNavigation: React.FC<IAlphabetNavigationProps> = ({
    onChange,
    names,
}) => {

    const createAlphabetItems = useMemo(() => {
        names.sort();
        let alphabet: any = {};
        names.forEach(name => {
            let firstChar = name.charAt(0).toUpperCase();
            if (Number(firstChar)) {
                firstChar = '0-9';
            }
            if (!alphabet[firstChar]) {
                alphabet[firstChar] = [];
            }
            alphabet[firstChar].push(name);
        });

        return Object.entries(alphabet).map(([key, value]: [string, string[]]) => {
            return (
                <div className={s.alphabetTable} key={key}>
                    <div className={s.alphabetKey}>{key}</div>
                    <div>
                        {value.map((name, index) => (
                            <div className={s.alphabetName} onClick={() => onChange?.(name)} key={index} >
                                {name}
                            </div>
                        ))}
                    </div>
                </div>
            );
        });

    }, [names]);


    return (
        <div style={{ width: '100%', height: '100%'}}>
            <Scroller children={<div className={s.alphabetContainer} style={{ width: '100%', height: '100%', display: 'flex' }}>
                {createAlphabetItems}
            </div>} />
        </div>
    );
};

export default memo(AlphabetNavigation);