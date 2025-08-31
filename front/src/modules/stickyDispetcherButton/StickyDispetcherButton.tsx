import React, { useState, memo,CSSProperties } from 'react';
import { useAppSelector } from 'src/store/hooks/redux';
import { NavLink } from 'react-router-dom';
import s from './style.module.css';

interface StickyDispatcherButtonProps {
    top?: string;
    left: string;
    memo?: boolean;
}

const StickyDispatcherButton: React.FC<StickyDispatcherButtonProps> = memo(({ 
    left, 
    top = '100px' 
}) => {
    const [show, setShow] = useState(false);
    const { footer } = useAppSelector(state => state.dispetcherReducer);

    const toggleVisibility = () => setShow(prev => !prev);

    const positionStyle:CSSProperties = {
        position:  'fixed',
        bottom: top,
        left,
    };

    return (
        <div 
            onClick={toggleVisibility}
            className={s.stickyDispetcherBlock}
            style={{
                ...positionStyle,
                background: "url('/chat.svg') no-repeat center white",
                backgroundSize: "80%",
            }}
            aria-label="Contact dispatcher"
        >
            {show && (
                <div className={s.dispetchers}>
                    <NavLink 
                        to='https://t.me/TSUMcollectBot' 
                        className={s.dispetcherA}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        WhatsApp
                    </NavLink>
                    <NavLink 
                        to="" 
                        className={s.dispetcherA}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Telegram
                    </NavLink>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default StickyDispatcherButton;