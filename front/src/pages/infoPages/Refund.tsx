import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
const Refund: React.FC = () => {

    return (
        <div className={s.infoPage}>
            <div className={s.mainHeader}>Обмен и возврат </div>
            <div className={s.middleHeader + " " + s.center}>
                Обмен и возврат
            </div>
            <div className={s.middleHeader}>
                Обмен
            </div>
            <div>
                Вы можете обменять товар, купленный в нашем магазине, при соблюдении следующих условий: <br />
                <ul>
                    <li>
                        с момента получения товара и на момент его обмена прошло не более 14 календарных дней;
                    </li>
                    <li>
                        товар не был в употреблении (стиран, ношен);
                    </li>
                    <li>
                        сохранены его товарный вид, потребительские свойства;
                    </li>
                    <li>
                        пломбы, фабричные ярлыки, в том числе КИЗ (контрольно-идентификационный знак) на товаре или его упаковке (в зависимости от того, что применимо) должны быть целыми, не мятыми и не повреждёнными.
                    </li>
                </ul>
                Если условия не соблюдены, мы не сможем обменять ваш товар. <br />
                Обратите внимание, что при обмене вы самостоятельно несете все связанные с этим расходы, в том числе расходы на доставку.
            </div>
            <div className={s.middleHeader}>
                Как запросить обмен?
            </div>
            <div>
                Для того, чтобы запросить обмен, напишите нам на адрес электронной почты refunds@thesortage.com письмо с темой "Обмен". В письме необходимо обязательно указать: <br />
                <ul>
                    <li>
                        номер вашего заказа, который можно найти в личном кабинете, или, если вы оформляли заказ в качестве гостя, в электронном письме с подтверждением заказа;
                    </li>
                    <li>
                        контактный номер телефона.
                    </li>
                </ul>
                После получения письма с вами по телефону свяжется наш сотрудник.
            </div>

            <div className={s.middleHeader}>
                Отправка обмена
            </div>
            <div>
                Отправить товар для обмена необходимо по адресу: Москва, ул. Пятницкая д. 71/5с2, офис 410 (метро Добрынинская). Время работы: 10:00 - 19:30 без выходных. <br /><br />
                Внимание! Пожалуйста, не отправляйте товар без предварительного уведомления, заранее напишите нам на адрес электронной почты refunds@thesortage.com.
                Оригинальная коробка товара, в которой вы получили вещь, не подходит для транспортировки, так как считается частью комплекта. Если она повредится при перевозке, мы не сможем принять обмен. Мы настоятельно рекомендуем проследить за тем, чтобы брендированная коробка была помещена вами или сотрудниками СДЕК в фирменную транспортную коробку СДЕК для сохранения целостности и товарного вида всего комплекта. <br /><br />
                Пыльники, чехлы и другие аксессуары из комплекта также нужно вернуть вместе с вещью.<br /><br />
                Обратите внимание, что затраты на доставку товара до нашего офиса возмещению не подлежат – их необходимо оплатить самостоятельно. <br /><br />
            </div>
            <div className={s.middleHeader}>
                Возврат
            </div>
            <div>
                Вы можете вернуть товар, купленный в нашем магазине, при соблюдении следующих условий:<br />
                <ul>
                    <li>
                        с момента получения товара и на момент его возврата прошло не более 14 календарных дней;
                    </li>
                    <li>
                        товар не был в употреблении (стиран, ношен);
                    </li>
                    <li>
                        сохранены его товарный вид, потребительские свойства;
                    </li>
                    <li>
                        пломбы, фабричные ярлыки, в том числе КИЗ (контрольно-идентификационный знак) на товаре или его упаковке (в зависимости от того, что применимо) должны быть целыми, не мятыми и не повреждёнными.
                    </li>
                </ul>
                Если условия возврата не соблюдены, и возвращенные товары не могут быть приняты, клиент получит соответствующее уведомление на электронную почту. В письме будет указана причина отказа.
                В этом случае по просьбе клиента возвращенные товары могут быть отосланы обратно, связанные с этим расходы оплачиваются клиентом. Если клиент отказывается от отправки товаров, мы сохраняем за собой право оставить товары у себя без возврата их стоимости.  <br /><br />
                При возникновении спора о факте употребления товара и сохранности его товарного вида производится независимая экспертиза за счёт клиента.
            </div>
            <div className={s.middleHeader}>
                Как запросить возврат?
            </div>
            <div>
            Для того, чтобы запросить возврат, напишите нам на адрес электронной почты refunds@thesortage.com письмо с темой "Возврат". В письме необходимо обязательно указать: <br />
            <ul>
                    <li>
                        номер вашего заказа, который можно найти в личном кабинете, или, если вы оформляли заказ в качестве гостя, в электронном письме с подтверждением заказа;
                    </li>
                    <li>
                        контактный номер телефона.
                    </li>
                </ul>
                После получения письма с вами по телефону свяжется наш сотрудник.
            </div>
            <div className={s.middleHeader}>
              Отправка возврата
            </div>
            <div className={s.infoPlace}>
            Возврат товара из интернет-магазина осуществляется по адресу:: Москва, ул. Пятницкая д. 71/5с2, офис 410 (метро Добрынинская). Время работы: 10:00 - 19:30 без выходных. <br /><br />
            Внимание! Пожалуйста, не возвращайте товар без предварительного уведомления, заранее напишите нам на адрес электронной почты refunds@thesortage.com. <br /><br />
            Оригинальная коробка товара, в которой вы получили вещь, не подходит для транспортировки, так как считается частью комплекта. Если она повредится при перевозке, мы не сможем принять возврат. Мы настоятельно рекомендуем проследить за тем, чтобы брендированная коробка была помещена вами или сотрудниками СДЕК в фирменную транспортную коробку СДЕК для сохранения целостности и товарного вида всего комплекта.  <br /><br />
            Пыльники, чехлы и другие аксессуары из комплекта также нужно вернуть вместе с вещью. <br /><br />
            Обратите внимание, что затраты на доставку товара до нашего офиса возмещению не подлежат – их необходимо оплатить самостоятельно. Исключениями являются: бракованный или дефектный товар, а также случаи ошибочно отправленного товара. <br /><br />
            </div>
            <div className={s.middleHeader}>
            Как и когда будут возвращены деньги?
            </div>
            <div>
            После получения мы проверим предмет возврата на соблюдение условий возврата в течение 2 рабочих дней, и, если товар соответствует требованиям, деньги будут возвращены в течение 10 рабочих дней тем же способом, которым вы оплатили заказ. <br />
            Возврат денежных средств осуществляется без учета стоимости доставки. Все расходы, связанные с обратной транспортировкой возврата, несет клиент. <br />
            Все случаи возврата товаров в нашем магазине регулируются действующими на территории России законами: <br />
            Постановлением Правительства РФ от 31.12.2020 N 2463 "Об утверждении Правил продажи товаров по договору розничной купли-продажи, перечня товаров длительного пользования, на которые не распространяется требование потребителя о безвозмездном предоставлении ему товара, обладающего этими же основными потребительскими свойствами, на период ремонта или замены такого товара, и перечня непродовольственных товаров надлежащего качества, не подлежащих обмену, а также о внесении изменений в некоторые акты Правительства Российской Федерации";<br />
            Федеральным Законом от 07 февраля 1992 года N 2300-1 "О защите прав потребителей". <br />
            </div>
        </div>
    )
}


export default Refund