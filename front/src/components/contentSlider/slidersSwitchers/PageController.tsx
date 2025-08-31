import React, { useState, useEffect, useMemo, useCallback } from 'react';
import s from "./linkController.module.scss";

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

            return (
                <div 
                    key={`page-${val}`}
                    className={s.buttonStyle}
                    onClick={() => {
                        setActive(val);
                        callback(val);
                    }}
                >
                    <span 
                        className={s.spanStyle}
                        style={{ color: active === val ? "red" : "" }}
                    >
                        {val}
                    </span>
                </div>
            );
        });
    }, [active, positions, generatePageNumbers, callback]);

    const handleLeftClick = useCallback(() => {
        if (active > 1) {
            callback(active - 1);
        }
    }, [active, callback]);

    const handleRightClick = useCallback(() => {
        if (active < positions) {
            callback(active + 1);
        }
    }, [active, positions, callback]);

    return (
        <div className={s.paginationContainer}>
            <div className={s.paginationArrow}>
                <button 
                    onClick={handleLeftClick}
                    className={`${s.paginate} ${s.right1}`}
                    disabled={active === 1}
                >
                    <i className={s.pg}></i>
                    <i className={s.pg}></i>
                </button>
            </div>

            <div className={s.paginationPages}>
                {renderPageButtons}
            </div>

            <div className={s.paginationArrow}>
                <button 
                    onClick={handleRightClick}
                    className={`${s.paginate} ${s.right}`}
                    disabled={active === positions}
                >
                    <i className={s.pg}></i>
                    <i className={s.pg}></i>
                </button>
            </div>
        </div>
    );
};

export default React.memo(PageController);