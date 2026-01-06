import React, { useRef, useState, useCallback, ChangeEvent, FocusEvent, useEffect } from 'react';
import s from "../style.module.css";
const PRICE_MATCH_TEXT = "Если вы нашли данную модель где-либо в наличии по более низкой цене — пришлите нам ссылку на данную модель в другом магазине. Мы будем рады предложить вам скидку, компенсирующую разницу в стоимости, и лучшую цену относительно конкурентов. Обратите внимание, что акция распространяется только на российские платформы.";
const DELIVERY_TEXT = "Бесплатная доставка при заказе от 5000 ₽. Доставка осуществляется в течение 1-3 рабочих дней с момента оформления заказа. Возможна экспресс-доставка за дополнительную плату.";
const PAY_TEXT = "Оплата"
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';


const AbstractInfo: React.FC = ({

}) => {


    return (
        <div>
            <DoubleInfoDrop
                className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }}
                info="ГАРАНТИЯ ЛУЧШЕЙ ЦЕНЫ"
            >
                <div>{PRICE_MATCH_TEXT}</div>
            </DoubleInfoDrop>
            <DoubleInfoDrop
                className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }}
                info="ДОСТАВКА"
            >
                <div>{DELIVERY_TEXT}</div>
            </DoubleInfoDrop>
        </div>

    );
};

export default React.memo(AbstractInfo);

