import React, { memo } from 'react';
import UserForm from 'src/modules/sendForm/UserForm';
import type { CustomerData } from 'src/providers/userProvider';

interface InfoTabProps {
    user: CustomerData | null;
    onSaved: () => void;
}

const InfoTab: React.FC<InfoTabProps> = ({ user, onSaved }) => {
    return <UserForm user={user} onSaved={onSaved} />;
};

export default memo(InfoTab);