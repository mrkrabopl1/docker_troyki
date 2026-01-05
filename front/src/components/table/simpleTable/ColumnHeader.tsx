import React, { ReactNode, memo } from 'react';
import s from "./style.module.css";

interface ColumnHeaderProps {
    children: ReactNode;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ children }) => {
    return (
        <div style={{ position: "fixed", top: 0 }}>
            {children}
        </div>
    );
};

export default memo(ColumnHeader);