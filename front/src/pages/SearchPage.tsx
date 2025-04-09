import React, { useEffect, ReactElement, useState, useRef, lazy ,useCallback} from 'react'
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import SnickersSettings from 'src/modules/settingsPanels/SnickersSettings'
import Button from 'src/components/Button'
import MerchSliderField from 'src/modules/merchField/MerchFieldWithPageSwitcher'
import s from "./style.module.css"
import { useAppDispatch } from 'src/store/hooks/redux'
import { getSnickersByString, getSnickersAndFiltersByString } from "src/providers/searchProvider"
import { show, sticky } from 'src/store/reducers/menuSlice'
import { ReactComponent as FoureGrid } from 'src/../public/foureGrid.svg';
import { ReactComponent as SixGrid } from 'src/../public/sixGrid.svg';
import { useLocation } from 'react-router-dom';
import { sizes } from 'src/constFiles/size'
import RadioGroup from 'src/components/radio/RadioGroup'
import { ReactComponent as Sort } from 'src/../public/sort.svg';

interface FiltersInfoRequest {
    sizes: string[],
    price: number[],
    firms: string[]
}

interface FiltersState {
    priceProps: {
        max: number,
        min: number,
        dataLeft?: number,
        dataRight?: number,
        onChange?: (arg: any) => void
    },
    checboxsProps: {
        name: string,
        props: any
    }[]
}
const SearchPage: React.FC<any> = () => {

    const { state } = useLocation();
    let filtersInfo = useRef<FiltersInfoRequest>({
        sizes: [],
        price: [],
        firms: []
    })

    const emptyData = useRef<boolean>(false)
    const [refresh, setRefresh] = useState(false)
    const test = useRef<boolean>(true)
    let activeSizes = useRef<string[]>([])
    let orderType = useRef<number>(0)
    let settingsModuleMemo = useRef<boolean>(true)
    let firms = useRef<string[]>([])
    let searchWord = useRef<string>(state ? state : "")
    let dispatch = useAppDispatch()
    let emtyText = useRef<string>("По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу.")
    let [merchFieldData, setMerchFieldData] = useState<any>([])
    let [grid, setGrid] = useState<boolean>(false)
    const pageWrap = useRef<HTMLDivElement>(null)
    let currentPage = useRef<number>(1)
    let pages = useRef<number>(1)
    let pageSize = useRef<number>(6)

    let [filtersState, setFilters] = useState<FiltersState>({
        priceProps: {
            max: 0,
            min: 0,
        },
        checboxsProps: []
    })
    const updatePage = useCallback((respData: any) => {
        if (respData.snickers.length === 0) {
            emptyData.current = true
            emtyText.current = "По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу."
            setRefresh(prev=>!prev)
        } else {
            emptyData.current = false
            pages.current = respData.pages
            const data = convertFilterseData(respData.filters)
            setFilters(data)
            settingsModuleMemo.current = !settingsModuleMemo.current;
            setMerchFieldData(respData.snickers)
        }
    },[])
    useEffect(() => {
        if (state) {
            searchWord.current = state
            getSnickersAndFiltersByString(state, updatePage, currentPage.current, pageSize.current, filtersInfo.current, orderType.current)
        }
    }, [])
    const updatMerch = useCallback( (respData: any) => {
        pages.current = respData.pages
        if (respData.snickers.length === 0) {
            emptyData.current = true
            emtyText.current = "По запросу ничего не найдено. Сбросить фильтры"
            setRefresh(prev=>!prev)
        } else {
            emptyData.current = false
            setMerchFieldData(respData.snickers)
        }
    },[])
    const searchCallback = (searchData: string) => {
        searchWord.current = searchData;
        getSnickersByString(searchWord.current, updatMerch, currentPage.current, pageSize.current, filtersInfo.current, orderType.current)
    }
    
    let [showSettings, setShowSettings] = useState<boolean>(false)
    let [showFilters, setShowFilters] = useState<boolean>(false)

    const convertFilterseData = (resData: { price: number[], avalible: boolean, firmsCount: { [key: string]: string }, sizes: { [key: string]: number } }) => {

        let priceProps: any = {
            min: resData.price[0],
            max: resData.price[1],
            dataLeft: resData.price[0],
            dataRight: resData.price[1]
        }
        if (filtersInfo.current.price.length !== 0) {
            priceProps.dataLeft = filtersInfo.current.price[0]
            priceProps.dataRight = filtersInfo.current.price[1]
        }

        let checkBoxPropsData: any = []
        if (test.current) {
            sizes.sizes.us.forEach(el => {
                let strEl = String(el)
                let size = resData.sizes[strEl]

                if (size != 0) {
                    activeSizes.current.push(strEl);
                    let active = filtersInfo.current.sizes.indexOf(strEl) !== -1
                    checkBoxPropsData.push({ enable: true, activeData: active, name: strEl + "(" + size + ")" })
                }
            })

        }


        let sizeObj = {
            name: "sizes",
            props: checkBoxPropsData
        }

        const entries = Object.entries(resData.firmsCount)

        let checkBoxPropsFirmData: any = []
        for (let i = 0; i < entries.length; i++) {
            firms.current.push(entries[i][0])
            let active = filtersInfo.current.firms.indexOf(entries[i][0]) !== -1
            checkBoxPropsFirmData.push({ enable: true, activeData: active, name: entries[i][0] + "(" + entries[i][1] + ")" })
        }

        let firmObj = {
            name: "firms",
            props: checkBoxPropsFirmData
        }
        let settingsData: any = {
            checboxsProps: []
        };

        settingsData["priceProps"] = priceProps
        settingsData["checboxsProps"].push(sizeObj);
        settingsData["checboxsProps"].push(firmObj);
        return settingsData
    }

    let styleData = {
        main: s.main,
        dropList: s.drop_list
    }



    const manipulateMenu = (e: React.WheelEvent<HTMLDivElement>) => {
        if (pageWrap.current) {
            if (e.deltaY > 0) {
                if (window.scrollY + e.deltaY < 100) {
                    dispatch(sticky(false))
                } else {
                    dispatch(sticky(true))
                    dispatch(show(false))
                }
            } else {
                dispatch(sticky(true))
                dispatch(show(true))
            }
        }
    }

    const onFiltersChange = useCallback((filter: any) => {
        let index: number;
        switch (filter.name) {
            case "sizes":
                filter.data.forEach((data:boolean, index:number) => {
                    let size = activeSizes.current[index];
                    index = filtersInfo.current.sizes.indexOf(size)
                    if (index !== -1 && !data) {
                        filtersInfo.current.sizes.splice(index, 1)
                    } else {
                        if (data) {
                            filtersInfo.current.sizes.push(size)
                        }
                    }
                })
                break
            case "price":
                filtersInfo.current.price = filter.data
                break
            case "firms":
                filter.data.forEach((data,index)=>{
                    let firm = firms.current[index];
                    index = filtersInfo.current.firms.indexOf(firm)
                    if (index !== -1 && !data) {
                        filtersInfo.current.firms.splice(index, 1)
                    } else {
                        if (index === -1 && data) {
                            filtersInfo.current.firms.push(firm)
                        }
                    }
                })
                break
        }
        getSnickersByString(searchWord.current, updatMerch, currentPage.current, pageSize.current, filtersInfo.current, orderType.current)
    },[updatMerch])


    const pageChange = (page: number) => {
        currentPage.current = page;
        getSnickersByString(searchWord.current, updatMerch, currentPage.current, pageSize.current, filtersInfo.current, orderType.current)
    }
    const orderTypeChange = (ind: number) => {
        orderType.current = ind;
        getSnickersByString(searchWord.current, updatMerch, currentPage.current, pageSize.current, filtersInfo.current, orderType.current)
    }


    const resetFilters = () => {
        filtersInfo.current = {
            sizes: [],
            price: [],
            firms: []
        }
        getSnickersByString(searchWord.current, updatMerch, currentPage.current, pageSize.current, filtersInfo.current, orderType.current)
    }



    return (

        <div ref={pageWrap} onWheel={(e) => manipulateMenu(e)}>


            <div style={{ position: "relative" }}>
                <div className={s.head}>
                    Результаты поиска.
                </div>
                <SearchWithList val={searchWord.current} className={styleData} searchCallback={searchCallback} />
                {emptyData.current ?
                    <div className={s.emptyRow}>
                        {emtyText.current}<span onClick={() => { resetFilters() }}></span>
                    </div> :
                    <div>


                        <MerchSliderField onChange={pageChange} currentPage={currentPage.current} pages={pages.current} heightRow={300} size={grid ? 2 : 3} data={merchFieldData} />
                        <div onClick={() => {
                            setGrid(!grid)
                        }} style={{ position: "absolute", top: 0, width: "50px", height: "50px" }}>
                            {grid ? <FoureGrid /> : <SixGrid />}
                        </div>
                        

                        <div onMouseLeave={() => { }} style={showSettings ? { right: "0" } : {}} className={s.settings_holder}>
                            <Button className={s.settingsBtn} text={''} onChange={() => setShowSettings(!showSettings)} />
                            <SnickersSettings classNames={{ secondPage: s.secondPage }} memo={settingsModuleMemo.current} onChange={onFiltersChange}  {...filtersState} />
                        </div>
                        <div  onMouseLeave={() => { }} style={showFilters ? { left: "0" } : {}} className={s.filters_holder}>
                            <div className={ s.secondPage }>

                            <RadioGroup onChange={(id) => { orderTypeChange(id) }} name={"ordered"} lampArray={["Без сортировки", "По возрастанию цены", "По убыванию цены"]} />
                            </div>
                            <Button className={s.filterBtn} text={''} onChange={() => setShowFilters(!showFilters)} />
                        </div>

                    </div>
                }
            </div>
            
            


        </div>

    )
}

export default SearchPage