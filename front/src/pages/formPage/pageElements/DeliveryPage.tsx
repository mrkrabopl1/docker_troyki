import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import s from "../style.module.css"
import DeliveryTypeRadioGroup from './DeliveryTypeRadio';
import DataField from 'src/components/dataField/DataField';
import Button from 'src/components/Button';
import ContactInfo from './ContactInfo';
import MapComponent from 'src/modules/map/Map';

interface urlParamsType {
    address: any;
    contactInfo: any,
    onChange: (data: any) => void,
    onChangeInfo: (info: any) => void
    coords: [number, number]
};

const DeliveryPage: React.FC<urlParamsType> = (props) => {
    let { coords, address, contactInfo, onChange, onChangeInfo } = { ...props };
    
    return (
        <div className={s.deliveryPageContainer}>
          
             <div className={s.deliveryOptionsSection}>
                <div className={s.sectionCard}>
                    <DeliveryTypeRadioGroup onChange={onChange} />
                </div>
            </div>
            <div className={s.deliveryContentGrid}>
                <div className={s.mapSection}>
                    <div className={s.sectionCard}>
                        <div className={s.cardHeader}>
                            <span className={s.cardIcon}>📍</span>
                            <h3 className={s.cardTitle}>Точка доставки</h3>
                        </div>
                        <MapComponent location={coords} />
                    </div>
                </div>
                
                <div className={s.infoSection}>
                    <ContactInfo 
                        address={address} 
                        contactInfo={contactInfo} 
                        onChange={onChangeInfo} 
                    />
                </div>
            </div>
        </div>
    )
}

export default DeliveryPage;