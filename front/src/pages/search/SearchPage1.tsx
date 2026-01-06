import React, { useEffect, useState, useRef, useCallback } from 'react'
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import Button from 'src/components/Button'
import MerchSliderField from 'src/modules/merchField/MerchFieldWithPageSwitcher'
import MerchFieldWithScroll from 'src/modules/merchField/MerchFieldWithScroll';

import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import { getProductsAndFiltersByCategoryAndType, getProductsAndFiltersByString, getProductsByString, getProductsByCategoriesAndFilters } from "src/providers/searchProvider"
import { categories, show, sticky, types } from 'src/store/reducers/menuSlice'
import { ReactComponent as FoureGrid } from 'src/../public/foureGrid.svg'
import { ReactComponent as SixGrid } from 'src/../public/sixGrid.svg'
import { useLocation } from 'react-router-dom'
import RadioGroup from 'src/components/radio/RadioGroup'
import { useSearchParams } from 'react-router-dom';
import { ReactComponent as Filter } from 'src/../public/filter.svg'


interface FiltersInfoRequest {
  sizes: string[]
  price: number[]
  firms: string[],
  types: number[],
  store?: boolean
  discount?: boolean
}

interface FiltersState {
  priceProps: {
    max: number
    min: number
    dataLeft?: number
    dataRight?: number
    onChange?: (arg: any) => void
  }
  soloDataProps: {
    name: string,
    activeData: boolean,
    enable: boolean
  }[]
  checboxsProps: {
    name: string,
    id: string,
    props: any
  }[]
}

const SearchPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams();
  const { show, sticky, typesVal, categories } = useAppSelector(state => state.menuReducer);
  // Refs для хранения изменяемых данных без перерисовки
  const filtersInfo = useRef<FiltersInfoRequest>({
    sizes: [],
    price: [],
    firms: [],
    types: [],
    store: false,
    discount: false
  })
  const [hoverSettings, setHoverSettings] = useState(false);
  const emptyData = useRef(false)
  const [refresh, setRefresh] = useState(false)
  const [hasMore, setHasMore] = useState(true);
  const activeSizes = useRef<string[]>([])
  const orderType = useRef(0)
  const settingsModuleMemo = useRef(true)
  const firms = useRef<string[]>([])
  const searchWord = useRef("")
  const categoryRef = useRef(0)
  const typeRef = useRef(0)
  const emtyText = useRef("По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу.")
  const [merchFieldData, setMerchFieldData] = useState<any[]>([])
  const [grid, setGrid] = useState(false)
  const pageWrap = useRef<HTMLDivElement>(null)
  const currentPage = useRef(1)
  const totalCount = useRef(1)
  const pageSize = useRef(18)
  const typesValRef = useRef(typesVal)
  const [showSettings, setShowSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filtersState, setFilters] = useState<FiltersState>({
    priceProps: { max: 0, min: 0 },
    checboxsProps: [],
    soloDataProps: []
  })

   const merchFieldRef = useRef(null);
    
    const handleScrollToTop = useCallback(() => {
        merchFieldRef.current?.scrollToTop();
    }, []);

  // Мемоизированные колбэки
  const updatePage = useCallback((respData: any) => {
    if (respData.products.length === 0) {
      emptyData.current = true
      emtyText.current = "По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу."
      setRefresh(prev => !prev)
    } else {
      emptyData.current = false
      totalCount.current = respData.totalCount
      const data = convertFilterseData(respData.filters)
      setFilters(data)
      settingsModuleMemo.current = !settingsModuleMemo.current
      setMerchFieldData(respData.products)
    }
  }, [])

  const updatMerch = useCallback((respData: any) => {
    totalCount.current = respData.totalCount
    if (respData.products.length === 0) {
      emptyData.current = true
      emtyText.current = "По запросу ничего не найдено. Сбросить фильтры"
      setRefresh(prev => !prev)
    } else {
      emptyData.current = false
      setMerchFieldData(respData.products)
    }
  }, [])

  const searchCallback = useCallback((searchData: string) => {
    searchWord.current = searchData
    let params = {};
    if (searchWord.current) {
      params["name"] = searchData
    }

    if (categoryRef.current) {
      params["category"] = categoryRef.current
    }

    if (typeRef.current) {
      params["type"] = typeRef.current
    }


    getProductsByCategoriesAndFilters(
      params,
      updatMerch,
      currentPage.current,
      pageSize.current,
      filtersInfo.current,
      orderType.current
    )
  }, [updatMerch])

  // Преобразование данных фильтров
  const convertFilterseData = useCallback((resData: {
    price: number[],
    avalible: boolean,
    firmsCount: { [key: string]: string },
    sizes: { [key: string]: string }
    types?: number[]
    store?: boolean,
    discount?: boolean
  }) => {
    const priceProps = {
      min: resData.price[0],
      max: resData.price[1],
      dataLeft: filtersInfo.current.price[0] || resData.price[0],
      dataRight: filtersInfo.current.price[1] || resData.price[1]
    }
    activeSizes.current = []
    firms.current = []
    const checkBoxPropsData: any[] = []

    // Обработка размеров одежды
    if (resData.sizes) {
      Object.entries(resData.sizes).forEach(([firm, count]) => {
        activeSizes.current.push(firm)
        const active = filtersInfo.current.sizes.includes(firm)
        checkBoxPropsData.push({
          enable: true,
          activeData: active,
          name: `${firm}`// `${firm}(${count})`
        })
      })
    }
    const checkBoxPropsTypeData: any[] = []
    if (resData.types) {
      resData.types.forEach((typeId) => {
        let typeDescr = typesValRef.current[typeId];
        if (!typeDescr) {
          return;
        }
        const active = filtersInfo.current.types.includes(typeId)
        let name = typeDescr.name
        if (typeDescr.type_key === "other") {
          name = typeDescr.category_name + "/" + typeDescr.name
        }
        checkBoxPropsTypeData.push({
          enable: true,
          activeData: active,
          name: `${typeDescr.name}(${resData.firmsCount[typeDescr.name] || 0})`
        })
        filtersInfo.current.types.push(typeId)
      }
      )
    }


    // Обработка фирм
    const checkBoxPropsFirmData: any[] = []
    Object.entries(resData.firmsCount).forEach(([firm, count]) => {
      firms.current.push(firm)
      const active = filtersInfo.current.firms.includes(firm)
      checkBoxPropsFirmData.push({
        enable: true,
        activeData: active,
        name: `${firm}`// `${firm}(${count})`
      })
    })

    return {
      priceProps,
      checboxsProps: [
        { id: "sizes", name: "Размеры", props: checkBoxPropsData },
        { id: "firms", name: "Фирмы", props: checkBoxPropsFirmData },
        { id: "type", name: "Типы товара", props: checkBoxPropsTypeData }
      ],
      soloDataProps: true ? [
        { name: "В наличии", activeData: false, enable: true },
        { name: "Со скидкой", activeData: false, enable: true }
      ] : []
    }
  }, [])


  const onFiltersChange = useCallback((filter: any) => {
    switch (filter.id) {
      case "sizes":
        filter.data.forEach((data: boolean, index: number) => {
          const size = activeSizes.current[index]
          // Обработка размеров одежды
          const clothesIndex = filtersInfo.current.sizes.indexOf(size)
          if (clothesIndex !== -1 && !data) {
            filtersInfo.current.sizes.splice(clothesIndex, 1)
          } else if (data && activeSizes.current.includes(size)) {
            filtersInfo.current.sizes.push(size)
          }

          // Обработка размеров обуви
          const snickersIndex = filtersInfo.current.sizes.indexOf(size)
          if (snickersIndex !== -1 && !data) {
            filtersInfo.current.sizes.splice(snickersIndex, 1)
          } else if (data && activeSizes.current.includes(size)) {
            filtersInfo.current.sizes.push(size)
          }
        })
        break

      case "price":
        filtersInfo.current.price = filter.data
        break

      case "firms":
        filter.data.forEach((data: boolean, index: number) => {
          const firm = firms.current[index]
          const firmIndex = filtersInfo.current.firms.indexOf(firm)

          if (firmIndex !== -1 && !data) {
            filtersInfo.current.firms.splice(firmIndex, 1)
          } else if (firmIndex === -1 && data) {
            filtersInfo.current.firms.push(firm)
          }
        })
        break
      case "solo":
        filter.data.forEach((data: boolean, index: number) => {
          if (index) {
            filtersInfo.current.discount = data
          } else {
            filtersInfo.current.store = data
          }
        })
        break
    }

    searchCallback(searchWord.current)
  }, [updatMerch])

  const pageChange = useCallback((page: number) => {
    currentPage.current = page
    searchCallback(searchWord.current)
  }, [updatMerch])

  const orderTypeChange = useCallback((ind: number) => {
    orderType.current = ind
    searchCallback(searchWord.current)
  }, [updatMerch])

  const resetFilters = useCallback(() => {
    filtersInfo.current = {
      sizes: [],
      price: [],
      firms: [],
      types: []
    }
    searchData()
  }, [updatMerch])


  useEffect(() => {
    if (Object.entries(typesVal).length === 0) {
      return;
    }
    handleScrollToTop()
    // Этот эффект сработает при каждом изменении query параметров
    filtersInfo.current.sizes = [];
    filtersInfo.current.firms = [];
    currentPage.current = 1;
    const category = searchParams.get('category') || "";
    let categoryId;
    let typeId

    if (category) {
      for (let key in categories) {
        if (key === category) {
          categoryId = categories[key].id
          break;
        }
      }
    }
    const type = searchParams.get('type');
    if (type) {
      for (let key in typesVal) {
        if (typesVal[key].type_key === type) {
          typeId = Number(key)
          break;
        }
      }
    }


    const name = searchParams.get('name') || "";
    categoryRef.current = categoryId
    typeRef.current = typeId
    searchWord.current = name
    searchData()
  }, [searchParams, typesVal]);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const fetchCollection = useCallback(async () => {
    if (loadingRef.current) return;

    setLoading(true);
    loadingRef.current = true;

    try {
      searchCallback(searchWord.current)
    } catch (error) {
      console.error('Error fetching collection:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

   const handleTopScroll = useCallback(() => {
        if (hasMore && !loadingRef.current) {
       currentPage.current =  currentPage.current - 1;
      fetchCollection();
    }
    }, [hasMore, currentPage, fetchCollection]);

  const handleScrollToBottom = useCallback(() => {
    if (hasMore && !loadingRef.current) {
       currentPage.current =  currentPage.current + 1;
      fetchCollection();
    }
  }, [hasMore, currentPage, fetchCollection]);
  const searchData = useCallback(() => {
    if (searchWord.current) {
      getProductsAndFiltersByString(
        searchWord.current,
        updatePage,
        currentPage.current,
        pageSize.current,
        filtersInfo.current,
        orderType.current
      )
    } else {
      getProductsAndFiltersByCategoryAndType(
        searchWord.current,
        updatePage,
        currentPage.current,
        pageSize.current,
        "0",
        categoryRef.current,
        typeRef.current,
        filtersInfo.current
      )
    }
  }, [getProductsAndFiltersByString, getProductsAndFiltersByCategoryAndType])

  const styleData = {
    main: s.main,
    dropList: s.drop_list
  }

  const handleMouseEnter = useCallback(() => setHoverSettings(true), []);
  const handleMouseLeave = useCallback(() => setHoverSettings(false), []);

  return (
    <div ref={pageWrap}>
      <div style={{ position: "relative" }}>
        <div className={s.head}>Результаты поиска.</div>
        <SearchWithList
          val={searchWord.current}
          className={styleData}
          searchCallback={searchCallback}
        />

        {emptyData.current ? (
          <div className={s.emptyRow}>
            {emtyText.current}
            <span onClick={resetFilters}></span>
          </div>
        ) : (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* <MerchSliderField
              onChange={pageChange}
              currentPage={currentPage.current}
              pages={totalCounturrent}
              heightRow={300}
              size={grid ? 2 : 3}
              data={merchFieldData}
            /> */}

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MerchFieldWithScroll
                data={merchFieldData}
                size={grid ? 2 : 3}
                onScrollPosition={() => { }}
                onScrollToBottom={handleScrollToBottom}
                onScrollToTop={handleTopScroll}
                loading={loading}
                ref={merchFieldRef}
                totalItems={totalCount.current}
              />
            </div>


            <div onClick={() => setGrid(!grid)} className={s.gridSwitcher}>
              {grid ? <FoureGrid /> : <SixGrid />}
            </div>

            <div
              style={showSettings ? {  } : {width:"0px"}}
              className={s.settings_holder}
            >


              <Filter style={{
                color: hoverSettings ? 'white' : 'black',
                fill: hoverSettings ? 'white' : 'white',
                stroke: hoverSettings ? 'white' : 'black'
              }}
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={s.settingsBtn}
              />


              <ProductsFilters
                classNames={{ secondPage: s.secondPage }}
                memo={settingsModuleMemo.current}
                onChange={onFiltersChange}
                {...filtersState}
              />
            </div>

            <div
              style={showFilters ? {  } : {width:"0px"}}
              className={s.filters_holder}
            >
              <div className={s.secondPage}>
                <RadioGroup
                  onChange={orderTypeChange}
                  name={"ordered"}
                  lampArray={[
                    "Без сортировки",
                    "По имени вверх",
                    "По имени вниз",
                    "По возрастанию цены",
                    "По убыванию цены"
                  ]}
                />
              </div>
              <Button
                className={s.filterBtn}
                text={''}
                onClick={() => setShowFilters(!showFilters)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(SearchPage)