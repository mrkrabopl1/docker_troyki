import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { getQuestions } from 'src/providers/faqProvider'
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import ReactHtmlParser from 'react-html-parser'
const Faq: React.FC = () => {

    let [questions, setQuestions] = useState<any>([])



    useEffect(() => {
        getQuestions(setQuestions)
    }, [])

//     let str = `<div>
//     1. Поиск товара
// </div>
// <div >
//     Чтобы найти интересующий вас товар, необходимо воспользоваться навигацией сайта. В мобильных устройствах и планшетах меню находится в левом верхнем углу и открывается нажатием. На ПК меню находится вверху экрана и открывается при наведении. В меню товары расположены по брендам и категориям. При нажатии на нужную вкладку вы попадете на страницу с интересующими вас товарами.
//     Кроме того, нужные товары можно находить по названию, ключевым словам или артикулу через поисковую строку, иконка которой расположена в верхнем углу экрана и открывается нажатием.
// </div>`






    return (
        <div>
            {questions.map(el=>{
                return < DoubleInfoDrop info={el.header}><div  dangerouslySetInnerHTML={{ __html:el.description }} ></div> </DoubleInfoDrop>
            })}
        </div>

    )
}


export default Faq