import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router';
import SearchWithList from 'src/modules/searchWithList/SearchWithList'
import ProductsFilters from "src/modules/settingsPanels/ProductsFilters"
import Button from 'src/components/Button'
import MerchSliderField from 'src/modules/merchField/MerchFieldWithPageSwitcher'
import s from "./style1.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import { getProductsAndFiltersByCategoryAndType, getProductsAndFiltersByString, getProductsByString, getProductsByCategoriesAndFilters } from "src/providers/searchProvider"
import { ReactComponent as FoureGrid } from '/public/foureGrid.svg'
import { ReactComponent as SixGrid } from '/public/sixGrid.svg'
import RadioGroup from 'src/components/radio/RadioGroup'
import { ReactComponent as Filter } from '/public/filter.svg'
import { set } from 'ol/transform';
import Combobox from 'src/components/combobox/Combobox';
import { finishLoading } from 'src/store/reducers/loadingSlice';

interface FiltersInfoRequest {
  sizes: string[]
  price: number[]
  firms: string[],
  bodytypes?: string[],
  lines?: string[],
  types: number[],
  store?: boolean,
  withPrice: boolean,
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

  const router = useRouter();
  const searchParams = router.query;
  const { typesVal, categories } = useAppSelector(state => state.menuReducer);
  // Refs для хранения изменяемых данных без перерисовки
  const filtersInfo = useRef<FiltersInfoRequest>({
    sizes: [],
    price: [],
    firms: [],
    types: [],
    store: false,
    discount: false,
    withPrice: true
  })
  const [hoverSettings, setHoverSettings] = useState(false);
  const emptyData = useRef(false)
  const [refresh, setRefresh] = useState(false)
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
  const pages = useRef(1)
  const pageSize = useRef(24)
  const typesValRef = useRef(typesVal)
  const [showSettings, setShowSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  const { widthProps } = useAppSelector(state => state.resizeReducer);
  const [filtersState, setFilters] = useState<FiltersState>({
    priceProps: { max: 0, min: 0 },
    checboxsProps: [],
    soloDataProps: []
  })

  // Мемоизированные колбэки
  const updatePage = useCallback((respData: any) => {
    dispatch(finishLoading());
    if (respData.products.length === 0) {
      emptyData.current = true
      emtyText.current = "По запросу ничего не найдено. Проверьте правописание или выберите другие слова либо фразу."
      setRefresh(prev => !prev)
    } else {
      emptyData.current = false
      pages.current = Math.ceil(respData.totalCount / pageSize.current);
      filtersInfo.current = {
        sizes: [],
        price: [],
        firms: [],
        types: [],
        lines: [],
        bodytypes: [],
        withPrice: true
      }
      const data = convertFilterseData(respData.filters)
      setFilters(data)
      settingsModuleMemo.current = !settingsModuleMemo.current
      setMerchFieldData(respData.products)
    }
  }, [])

  const updatMerch = useCallback((respData: any) => {
    pages.current = Math.ceil(respData.totalCount / pageSize.current);
    if (respData.products.length === 0) {
      emptyData.current = true
      emtyText.current = "По запросу ничего не найдено. Сбросить фильтры"
      setRefresh(prev => !prev)
    } else {
      emptyData.current = false
      setMerchFieldData(respData.products)
    }
  }, [])

  const searchNameCallback = useCallback((name: string) => {
    searchWord.current = name
    searchData()
  }, [updatMerch])

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
    withPrice: boolean
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
        name: `${firm}`
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
        { name: "Есть на складе", activeData: false, enable: true },
        { name: "Со скидкой", activeData: false, enable: true },
        { name: "В наличии", activeData: false, enable: true }
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

      // case "type":
      //   filter.data.forEach((data: boolean, index: number) => {
      //     const firm = firms.current[index]
      //     const firmIndex = filtersInfo.current.types.indexOf(firm)

      //     if (firmIndex !== -1 && !data) {
      //       filtersInfo.current.firms.splice(firmIndex, 1)
      //     } else if (firmIndex === -1 && data) {
      //       filtersInfo.current.firms.push(firm)
      //     }
      //   })
      //   break

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
          if (!index) {
            filtersInfo.current.discount = data
          } else if (index === 1) {
            filtersInfo.current.store = data
          } else {
            filtersInfo.current.withPrice = data
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

  const orderTypeChange = useCallback((ind: number | string) => {
    orderType.current = Number(ind)
    searchCallback(searchWord.current)
  }, [updatMerch])

  const resetFilters = useCallback(() => {
    filtersInfo.current = {
      sizes: [],
      price: [],
      firms: [],
      types: [],
      withPrice: true
    }
    searchData()
  }, [updatMerch])

  useEffect(() => {
    if (!pageWrap.current) return;

    const handleResize = () => {
      const width = pageWrap.current.clientWidth;
      if (width < 800) {
        setGrid(true);
        setShowGrid(false);
      } else {
        setGrid(false);
        setShowGrid(true);
      }
    };

    // Только слушатель resize + первоначальная проверка
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (Object.entries(typesVal).length === 0 || Object.entries(categories).length === 0) {
      return;
    }
    if (pageWrap.current && pageWrap.current.clientWidth < 600) {
      setGrid(true)
      setShowGrid(false)
    }
    typesValRef.current = typesVal;
    // Этот эффект сработает при каждом изменении query параметров
    filtersInfo.current.sizes = [];
    filtersInfo.current.firms = [];
    filtersInfo.current.types = [];
    typeRef.current = 0;
    categoryRef.current = 0;
    currentPage.current = 1;
    const category = searchParams.category || "";
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
    const type = searchParams.type || "";
    if (type) {
      for (let key in typesVal) {
        if (typesVal[key].type_key === type && typesVal[key].category_key === category) {
          typeId = Number(key)
          break;
        }
      }
    }

    let firm = searchParams.firm as string || "";

    if (firm) {
      filtersInfo.current.firms.push(firm)
    }
    let bodytype = searchParams.bodytype as string || "";
    if (bodytype) {
      filtersInfo.current.bodytypes.push(bodytype)
    }
    let line = searchParams.line as string || "";
    if (line) {
      filtersInfo.current.lines.push(line)
    }

    const name = searchParams.key_word as string || "";
    filtersInfo.current.discount = Boolean(searchParams.discount as string || "");
    if (categoryId) {
      categoryRef.current = categoryId
    }
    if (typeId) {
      typeRef.current = typeId
    }
    searchWord.current = name
    searchData()
  }, [searchParams, typesVal, categories]);


  const searchData = useCallback(() => {
    if (searchWord.current) {
      getProductsAndFiltersByString(
        searchWord.current,
        updatePage,
        currentPage.current,
        pageSize.current,
        categoryRef.current,
        typeRef.current,
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


  const handleMouseEnter = useCallback(() => setHoverSettings(true), []);
  const handleMouseLeave = useCallback(() => setHoverSettings(false), []);


  const [showSortPanel, setShowSortPanel] = useState(false) // для сортировки
  const [showFiltersPanel, setShowFiltersPanel] = useState(false) // для фильтров
  useEffect(() => {
    if (showSortPanel || showFiltersPanel) {
      document.body.classList.add('modalOpen')
    } else {
      document.body.classList.remove('modalOpen')
    }

    return () => {
      document.body.classList.remove('modalOpen')
    }
  }, [showSortPanel, showFiltersPanel])
  const rightBlockRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [stickyTop, setStickyTop] = useState(20);
  const stickyTopRef = useRef(20);

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        if (!rightBlockRef.current) return;
        const rightRect = rightBlockRef?.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const blockHeight = rightRect.height;
        const minTopOffset = 120;
        const startTopOffset = 20;

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;

        // Проверяем, нужно ли вообще обновлять
        const shouldBeSticky = rightRect.top <= minTopOffset;

        if (blockHeight <= windowHeight - minTopOffset) {
          // Короткий блок
          setIsSticky(shouldBeSticky);
          if (shouldBeSticky) {
            // Для короткого блока фиксируем top = minTopOffset
            const newTop = minTopOffset;
            if (delta < 0) {
              if (stickyTopRef.current !== newTop) {
                stickyTopRef.current = newTop;
                setStickyTop(newTop);
              }
            } else {
              if (stickyTopRef.current !== 0) {
                stickyTopRef.current = 0;
                setStickyTop(0);
              }
            }
          }
        } else {
          // Длинный блок
          if (isSticky) {
            // Уже в режиме sticky - двигаем с ограничениями
            let newTop = stickyTopRef.current - delta;
            const maxTop = 120;
            const minTop = windowHeight - blockHeight;
            newTop = Math.max(minTop, Math.min(maxTop, newTop));

            // Обновляем только если значение реально изменилось
            if (Math.abs(stickyTopRef.current - newTop) > 0.5) {
              stickyTopRef.current = newTop;
              setStickyTop(newTop);
            }
          } else {
            // Вход в sticky
            if ((delta < 0 && rightRect.top <= minTopOffset) ||
              (delta > 0 && rightRect.bottom <= windowHeight)) {
              setIsSticky(true);
              const initialTop = Math.max(
                windowHeight - blockHeight,
                Math.min(120, rightRect.top)
              );
              stickyTopRef.current = initialTop;
              setStickyTop(initialTop);
            }
          }
        }

        rafId = null;
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      // Используем debounce для ResizeObserver
      setTimeout(() => handleScroll(), 0);
    });

    resizeObserver.observe(rightBlockRef.current);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isSticky]);

  return (
    <div ref={pageWrap}>
      <div style={{ position: "relative" }}>
        <div className={s.head}>Результаты поиска.</div>
        <div style={{
          display: 'flex',
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginBottom: "20px",
          gap: "10px"
        }}>
          <div style={{ margin: "auto", width: "30%", padding: "5px" }}>
            {/* {showGrid ? <div onClick={() => setGrid(!grid)} className={s.gridSwitcher}>
                {grid ? <FoureGrid /> : <SixGrid />}
              </div> : <div style={{ width: "30%" }} />}  */}

            {widthProps ? <Filter style={{
              color: hoverSettings ? 'white' : 'black',
              fill: hoverSettings ? 'white' : 'white',
              stroke: hoverSettings ? 'white' : 'black'
            }}
              type="button"
              onClick={() => setShowSortPanel(true)}
              className={s.settingsBtn}
            /> : <Combobox
              enumProp={true}
              onChangeIndex={orderTypeChange}
              data={[
                "Без сортировки",
                "По имени вверх",
                "По имени вниз",
                "По возрастанию цены",
                "По убыванию цены"
              ]}
            />}
          </div>

          <SearchWithList
            val={searchWord.current}
            searchCallback={searchNameCallback}
            selectList={(data) => { router.push('/product/' + data); }}
          // style={{ flex: 1, maxWidth: "300px", margin: "0 auto" }} // Центрирование поиска
          />
          {widthProps ? <div style={{ margin: "auto", width: "30%" }}>
            <Button
              className={s.filterBtn}
              text={''}
              onClick={() => setShowFiltersPanel(true)}
            />
          </div> : <div style={{ margin: "auto", width: "30%" }} />}

        </div>

        {!emptyData.current ? <div className={s.settings_filters_holder}>
          <div
            style={showSettings ? { right: "0" } : {}}
            className={s.settings_holder}
          >
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
                  "По имени вверх",
                  "По имени вниз",
                  "По возрастанию цены",
                  "По убыванию цены"
                ]}
              />
            </div>
          </div>
        </div> : null}

        {emptyData.current ? (
          <div className={s.emptyRow}>
            {emtyText.current}
            <span onClick={resetFilters}></span>
          </div>
        ) : (

          <div style={{ position: "relative", display: "flex", alignItems: "flex-start" }}>
            <MerchSliderField
              onChange={pageChange}
              currentPage={currentPage.current}
              pages={pages.current}
              heightRow={300}
              size={grid ? 2 : 3}
              data={merchFieldData}
            />
            {widthProps ? null : <div
              ref={rightBlockRef}
              style={{
                width: "25%",
                position: isSticky ? "sticky" : "relative",
                top: isSticky ? `${stickyTop}px` : "0px",
                height: "fit-content",
                alignSelf: "flex-start",
                transition: "none"
              }}
            >


              <ProductsFilters
                classNames={{ secondPage: s.secondPage }}
                memo={settingsModuleMemo.current}
                onChange={onFiltersChange}
                {...filtersState}
              />
            </div>}

          </div>
        )}
      </div>
      {showSortPanel && (
        <div className={s.modalOverlay} onClick={() => setShowSortPanel(false)}>
          <div className={s.modalPanelLeft} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>Сортировка</h3>
              <button onClick={() => setShowSortPanel(false)}>✕</button>
            </div>
            <RadioGroup
              onChange={(ind) => {
                orderTypeChange(ind)
                setShowSortPanel(false)
              }}
              checked={orderType.current}
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
        </div>
      )}

      {/* Модальное окно фильтров */}
      {showFiltersPanel && (
        <div className={s.modalOverlay} onClick={() => setShowFiltersPanel(false)}>
          <div className={s.modalPanelRight} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>Фильтры</h3>
              <button onClick={() => setShowFiltersPanel(false)}>✕</button>
            </div>
            <ProductsFilters
              classNames={{ secondPage: s.secondPage }}
              memo={settingsModuleMemo.current}
              onChange={onFiltersChange}
              {...filtersState}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(SearchPage)