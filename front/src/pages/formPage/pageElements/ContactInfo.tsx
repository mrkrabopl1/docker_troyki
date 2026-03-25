import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import s from "../style.module.css"
import DataField from 'src/components/dataField/DataField';
import Button from 'src/components/Button';

interface urlParamsType {
    address: any;
    contactInfo: any,
    onChange: (data: any) => void,
    deliveryInfo?: any
};

const ContactInfo: React.FC<urlParamsType> = (props) => {
    let { address, contactInfo, onChange, deliveryInfo } = { ...props };
    
    const createDataField = useCallback((header, entries) => {
        let data = entries.map((data) => { 
            return { "caption": data[0], "description": data[1] } 
        })
        return <DataField header={header} data={data} />
    }, [contactInfo])

    // Исправленная версия с проверкой типа
    const hasContactInfo = Object.values(contactInfo).some(value => {
        // Проверяем, что value существует и является строкой
        if (value && typeof value === 'string') {
            return value.trim() !== "";
        }
        // Если value не строка, но существует, считаем что оно есть
        return Boolean(value);
    });
    
    const hasAddress = address && Object.values(address).some(value => {
        if (value && typeof value === 'string') {
            return value.trim() !== "";
        }
        return Boolean(value);
    });

    return (
        <div className={s.contactInfoGrid}>
            {hasContactInfo && (
                <div className={s.infoCard}>
                    <div className={s.infoCardContent}>
                        {createDataField("", Object.entries(contactInfo))}
                    </div>
                    <div className={s.infoCardFooter}>
                        <Button 
                            className={s.editButton} 
                            onClick={onChange} 
                            text="Редактировать"
                        />
                    </div>
                </div>
            )}
            
            {hasAddress && (
                <div className={s.infoCard}>
                    <div className={s.infoCardContent}>
                        {createDataField("", Object.entries(address))}
                    </div>
                    <div className={s.infoCardFooter}>
                        <Button 
                            className={s.editButton} 
                            onClick={onChange} 
                            text="Редактировать"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ContactInfo;