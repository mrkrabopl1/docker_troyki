import React, { useState, memo,CSSProperties } from 'react';
import { useAppSelector } from 'src/store/hooks/redux';
import { NavLink } from 'react-router-dom';
import s from './style.module.css';
import { ReactComponent as Telegram } from "/public/telegram.svg";
import { ReactComponent as Whatsapp } from "/public/whatsapp.svg";

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
                    <div className={s.linkBtn}>
                        <Telegram className={s.logo}/>
                    </div>
                    <div className={s.linkBtn}>
                        <Whatsapp className={s.logo}/>
                    </div>
                   
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => prevProps.memo === nextProps.memo);

export default StickyDispatcherButton;