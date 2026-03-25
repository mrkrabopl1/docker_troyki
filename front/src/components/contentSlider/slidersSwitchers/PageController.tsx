import React, { useState, useEffect, useMemo, useCallback } from 'react';
import s from "./pageController.module.scss";

interface PageControllerProps {
    currentPosition: number;
    positions: number;
    seenPage?: number;
    callback: (page: number) => void;
}

const PageController: React.FC<PageControllerProps> = ({
    seenPage = 3,
    currentPosition,
    positions,
    callback
}) => {
    const [active, setActive] = useState(currentPosition);

    useEffect(() => {
        console.log('currentPosition changed:', currentPosition);
        setActive(currentPosition);
    }, [currentPosition]);

    const generatePageNumbers = useCallback((current: number, total: number) => {
        const result: (number | null)[] = [];
        let count = 1;

        while (count <= total) {
            if (count > seenPage && count < current - 1) {
                count = current - 1;
                result.push(null);
            } else if (count > current + 1 && count < total - seenPage + 1) {
                count = total - seenPage + 1;
                result.push(null);
            }
            result.push(count);
            count++;
        }

        return result;
    }, [seenPage]);

    const renderPageButtons = useMemo(() => {
        const pageNumbers = generatePageNumbers(active, positions);

        return pageNumbers.map((val, index) => {
            if (val === null) {
                return (
                    <span 
                        key={`ellipsis-${index}`}
                        className={s.ellipsis}
                    >
                        ...
                    </span>
                );
            }
            const isActive = active === val;
            return (
                <div 
                    key={`page-${val}`}
                    className={`${s.buttonStyle} ${isActive ? s.active : ''}`}
                    onClick={() => {
                        console.log('Page clicked:', val);
                        setActive(val);
                        callback(val);
                    }}
                >
                    <span 
                        className={`${s.spanStyle} ${isActive ? s.active : ''}`}
                    >
                        {val}
                    </span>
                </div>
            );
        });
    }, [active, positions, generatePageNumbers, callback]);

    const handleLeftClick = useCallback((e: React.MouseEvent) => {
        console.log('Left click, active:', active, 'positions:', positions);
        e.preventDefault();
        e.stopPropagation();
        
        const newActive = active - 1;
        if (newActive >= 1) {
            console.log('Setting new active to:', newActive);
            setActive(newActive);
            callback(newActive);
        }
    }, [active, callback, positions]);

    const handleRightClick = useCallback((e: React.MouseEvent) => {
        console.log('Right click, active:', active, 'positions:', positions);
        e.preventDefault();
        e.stopPropagation();
        
        const newActive = active + 1;
        if (newActive <= positions) {
            console.log('Setting new active to:', newActive);
            setActive(newActive);
            callback(newActive);
        }
    }, [active, positions, callback]);

    console.log('Component render, active:', active);

    return (
        <div className={s.paginationContainer}>
            <div onClick={handleLeftClick} className={s.paginationArrow}>
                <button 
                    
                    className={`${s.paginate} ${s.right1}`}
                    disabled={active === 1}
                    aria-label="Previous page"
                >
                    <i className={s.pg}></i>
                    <i className={s.pg}></i>
                </button>
            </div>

            <div className={s.paginationPages}>
                {renderPageButtons}
            </div>

            <div  onClick={handleRightClick} className={s.paginationArrow}>
                <button 
                    className={`${s.paginate} ${s.right}`}
                    disabled={active === positions}
                    aria-label="Next page"
                >
                    <i className={s.pg}></i>
                    <i className={s.pg}></i>
                </button>
            </div>
        </div>
    );
};

export default React.memo(PageController);