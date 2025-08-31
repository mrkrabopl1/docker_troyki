import React, { useEffect, useState, useRef, useCallback } from 'react'
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import SnickersSettings from 'src/modules/settingsPanels/SnickersSettings'
import Button from 'src/components/Button'
import MerchSliderField from 'src/modules/merchField/MerchFieldWithPageSwitcher'
import s from "./style.module.css"
import { useAppDispatch } from 'src/store/hooks/redux'
import { getProductsAndFiltersByCategoryAndType, getProductsAndFiltersByString, getProductsByString, getProductsByCategoriesAndFilters } from "src/providers/searchProvider"
import { categories, show, sticky } from 'src/store/reducers/menuSlice'
import { ReactComponent as FoureGrid } from 'src/../public/foureGrid.svg'
import { ReactComponent as SixGrid } from 'src/../public/sixGrid.svg'
import { useLocation } from 'react-router-dom'
import RadioGroup from 'src/components/radio/RadioGroup'
import { useSearchParams } from 'react-router-dom';

interface FiltersInfoRequest {
  sizes: { clothes: string[], snickers: string[] }
  price: number[]
  firms: string[]
}

interface FiltersState {
  priceProps: {
    max: number
    min: number
    dataLeft?: number
    dataRight?: number
    onChange?: (arg: any) => void
  }
  checboxsProps: {
    name: string
    props: any
  }[]
}

const SearchPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams();


  // Refs для хранения изменяемых данных без перерисовки
  const filtersInfo = useRef<FiltersInfoRequest>({
    sizes: { clothes: [], snickers: [] },
    price: [],
    firms: []
  })

  const emptyData = useRef(false)
  const [refresh, setRefresh] = useState(false)
  const activeSizes = useRef({ clothes: [] as string[], snickers: [] as string[] })
  const orderType = useRef(0)
  const settingsModuleMemo = useRef(true)
  const firms = useRef<string[]>([])
  const activeSizesAll = useRef<string[]>([])
  const searchWord = useRef("")
  const categoryRef = useRef("")
  const typeRef = useRef("")
  const emtyText = useRef("По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу.")
  const [merchFieldData, setMerchFieldData] = useState<any[]>([])
  const [grid, setGrid] = useState(false)
  const pageWrap = useRef<HTMLDivElement>(null)
  const currentPage = useRef(1)
  const pages = useRef(1)
  const pageSize = useRef(6)
  const [showSettings, setShowSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filtersState, setFilters] = useState<FiltersState>({
    priceProps: { max: 0, min: 0 },
    checboxsProps: []
  })

  // Мемоизированные колбэки
  const updatePage = useCallback((respData: any) => {
    if (respData.products.length === 0) {
      emptyData.current = true
      emtyText.current = "По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу."
      setRefresh(prev => !prev)
    } else {
      emptyData.current = false
      pages.current = respData.pages
      const data = convertFilterseData(respData.filters)
      setFilters(data)
      settingsModuleMemo.current = !settingsModuleMemo.current
      setMerchFieldData(respData.products)
    }
  }, [])

  const updatMerch = useCallback((respData: any) => {
    pages.current = respData.pages
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
    if (categoryRef.current) {
      searchWord.current = searchData
      getProductsByCategoriesAndFilters(
        searchWord.current,
        categoryRef.current,
        updatMerch,
        currentPage.current,
        pageSize.current,
        filtersInfo.current,
        orderType.current
      )
    } else {
      getProductsByString(
        searchWord.current,
        updatMerch,
        currentPage.current,
        pageSize.current,
        filtersInfo.current,
        orderType.current
      )
    }
  }, [updatMerch])

  // Преобразование данных фильтров
  const convertFilterseData = useCallback((resData: {
    price: number[],
    avalible: boolean,
    firmsCount: { [key: string]: string },
    sizes: { [key: string]: number }
  }) => {
    const priceProps = {
      min: resData.price[0],
      max: resData.price[1],
      dataLeft: filtersInfo.current.price[0] || resData.price[0],
      dataRight: filtersInfo.current.price[1] || resData.price[1]
    }
    activeSizes.current.clothes = []
    activeSizes.current.snickers = []
    firms.current = []
    const checkBoxPropsData: any[] = []

    // Обработка размеров одежды
    if (resData.sizes.clothes) {
      Object.entries(resData.sizes.clothes).forEach(([size, count]) => {
        if (count !== 0) {
          activeSizes.current.clothes.push(size)
          const active = filtersInfo.current.sizes.clothes.includes(size)
          checkBoxPropsData.push({
            enable: true,
            activeData: active,
            name: `${size}(${count})`
          })
        }
      })
    }

    if (resData.sizes.snickers) {
      // Обработка размеров обуви
      Object.entries(resData.sizes.snickers).forEach(([size, count]) => {
        if (count !== 0) {
          activeSizes.current.snickers.push(size)
          const active = filtersInfo.current.sizes.snickers.includes(size)
          checkBoxPropsData.push({
            enable: true,
            activeData: active,
            name: `${size}(${count})`
          })
        }
      })
    }

    activeSizesAll.current = [...activeSizes.current.clothes, ...activeSizes.current.snickers]

    // Обработка фирм
    const checkBoxPropsFirmData: any[] = []
    Object.entries(resData.firmsCount).forEach(([firm, count]) => {
      firms.current.push(firm)
      const active = filtersInfo.current.firms.includes(firm)
      checkBoxPropsFirmData.push({
        enable: true,
        activeData: active,
        name: `${firm}(${count})`
      })
    })

    return {
      priceProps,
      checboxsProps: [
        { name: "sizes", props: checkBoxPropsData },
        { name: "firms", props: checkBoxPropsFirmData }
      ]
    }
  }, [])


  const onFiltersChange = useCallback((filter: any) => {
    switch (filter.name) {
      case "sizes":
        filter.data.forEach((data: boolean, index: number) => {
          const size = activeSizesAll.current[index]
          // Обработка размеров одежды
          const clothesIndex = filtersInfo.current.sizes.clothes.indexOf(size)
          if (clothesIndex !== -1 && !data) {
            filtersInfo.current.sizes.clothes.splice(clothesIndex, 1)
          } else if (data && activeSizes.current.clothes.includes(size)) {
            filtersInfo.current.sizes.clothes.push(size)
          }

          // Обработка размеров обуви
          const snickersIndex = filtersInfo.current.sizes.snickers.indexOf(size)
          if (snickersIndex !== -1 && !data) {
            filtersInfo.current.sizes.snickers.splice(snickersIndex, 1)
          } else if (data && activeSizes.current.snickers.includes(size)) {
            filtersInfo.current.sizes.snickers.push(size)
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
      sizes: { clothes: [], snickers: [] },
      price: [],
      firms: []
    }
    searchData()
  }, [updatMerch])


  useEffect(() => {
    // Этот эффект сработает при каждом изменении query параметров
    filtersInfo.current.sizes = {
      clothes: [], snickers: []
    }
    filtersInfo.current.firms = [];
    const category = searchParams.get('category') || "";
    const type = searchParams.get('type') || "";
    const name = searchParams.get('name') || "";
    categoryRef.current = category
    typeRef.current = type
    searchWord.current = name
    searchData()
  }, [searchParams]);


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
        typeRef.current
      )
    }
  }, [getProductsAndFiltersByString, getProductsAndFiltersByCategoryAndType])

  const styleData = {
    main: s.main,
    dropList: s.drop_list
  }

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
          <div>
            <MerchSliderField
              onChange={pageChange}
              currentPage={currentPage.current}
              pages={pages.current}
              heightRow={300}
              size={grid ? 2 : 3}
              data={merchFieldData}
            />

            <div onClick={() => setGrid(!grid)} className={s.gridSwitcher}>
              {grid ? <FoureGrid /> : <SixGrid />}
            </div>

            <div
              style={showSettings ? { right: "0" } : {}}
              className={s.settings_holder}
            >
              <Button
                className={s.settingsBtn}
                text={''}
                onClick={() => setShowSettings(!showSettings)}
              />
              <SnickersSettings
                classNames={{ secondPage: s.secondPage }}
                memo={settingsModuleMemo.current}
                onChange={onFiltersChange}
                {...filtersState}
              />
            </div>

            <div
              style={showFilters ? { left: "0" } : {}}
              className={s.filters_holder}
            >
              <div className={s.secondPage}>
                <RadioGroup
                  onChange={orderTypeChange}
                  name={"ordered"}
                  lampArray={[
                    "Без сортировки",
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