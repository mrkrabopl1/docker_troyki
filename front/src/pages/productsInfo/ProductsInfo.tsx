// src/pages/productsInfo/ProductsInfo.tsx
import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector,useNavigate } from 'src/store/hooks/redux';
import { cartCountAction } from 'src/store/reducers/menuSlice';
import { getMerchInfo } from "src/providers/merchProvider";
import { createPreorder, updatePreorder } from 'src/providers/orderProvider';
import { getCookie } from 'src/global';
import { toPrice } from 'src/global';
import PriceHolder from 'src/modules/PriceHolder/PriceHolder';
import ImagePresantation from 'src/components/imagesPresantation/ImagesPresentation';
import ImagePresantationBlock from "src/components/imagesPresantation/ImagePresentationBlock";
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import Scroller from 'src/components/scroller/Scroller';
import TableWithComboboxColumn from 'src/components/table/simpleTable/TableWithComboboxColumn';
import ContentSlider from 'src/components/contentSlider/ContentSliderWithLinks';
import s from "./style.module.css";
import { ReactComponent as CopySvg } from "/public/copy.svg";
import { ReactComponent as Shoe } from "/public/shoe_size.svg";
import { ReactComponent as Clothes } from "/public/clothes_size.svg";
import SVGIcon from 'src/components/svgIcon/SvgIcon';
import AbstractInfo from './pageBlocks/AbstractInfo';
import merchType from 'src/types/merchType';
import { finishLoading, startLoading } from 'src/store/reducers/loadingSlice';
import { SIZE_TABLES } from 'src/constants/sizeTables';

interface ProductInfo {
    image_count: number;
    image_path: string;
    name: string;
    line?: string;
    info: merchType;
    discount?: Record<string, {discounted_price: number,percent: number }>;
    store?: Record<string, number>;
    firm?: string;
    id?: string;
    type_id: number;
    minprice?: number;
    article: string;
    line_products?: any[];
    image_extansion: string;
    bodytype: string;
}

interface SizeTable {
    sizes: Record<string, number[]>;
    table: Array<{ title: string; subtitle?: string; table: string[] }>;
    comboTable: Array<{ title: string; subtitle?: string; table: string[] }>;
}

interface ProductsInfoProps {
    initialData?: ProductInfo | null; // 🔥 Добавляем пропс для SSR данных
}

const ProductsInfo: React.FC<ProductsInfoProps> = ({ initialData }) => {
    const navigate = useNavigate()
    const { show, sticky, typesVal, categories, firmMap } = useAppSelector(state => state.menu);
    const router = useRouter();
    const product = router.query.product as string;
    const { widthProps } = useAppSelector(state => state.resize);
    const { cartCount } = useAppSelector(state => state.menu);
    const dispatch = useAppDispatch();

    const [merchInfo, setMerchInfo] = useState<ProductInfo>({ 
        bodytype: "man", 
        article: "", 
        image_path: "", 
        image_count: 0, 
        name: "", 
        info: {}, 
        type_id: 0, 
        image_extansion: "webp" 
    });
    
    const [activeModal, setActiveModal] = useState(false);
    const [activeProductsModal, setActiveProductsModal] = useState(false);
    const [local] = useState("ru");
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [emptyPage, setEmptyPage] = useState(false);
    
    const currentSize = useRef<string>("");
    const currentDiscount = useRef<number>(0);
    const bodytype = useRef<string>("man");
    const currentPriceDiscount = useRef<number>(0);
    const pricesArr = useRef<merchType>({});
    const merchType = useRef<string>("");
    const isHydrated = useRef(false); // 🔥 Флаг для SSR

    const setMerchInfoHandler = useCallback((val: ProductInfo) => {
        bodytype.current = val.bodytype;
        if (bodytype.current === "unisex") {
            bodytype.current = "man";
        }
        merchType.current = typesVal[val.type_id]?.category_key;
        processProducts(val);
    }, [typesVal, categories]);

    const processProducts = useCallback((val: ProductInfo) => {
        if (Object.keys(val.info).length === 0) {
            setEmptyPage(true);
            setMerchInfo(val);
            setCurrentPrice(0);
        } else {
            pricesArr.current = val.info;
            val.discount && Object.entries(val.discount).forEach(data => {
                pricesArr.current[data[0]].discount = data[1].percent;
            });

            currentSize.current = Object.keys(val.info)[0] || "";
            const discount = val.discount?.[currentSize.current]?.percent || 0;
            const price = Number(Object.values(val.info)[0]?.price) || 0;

            setEmptyPage(false);
            currentDiscount.current = discount;
            currentPriceDiscount.current = price;
            setCurrentPrice(price - price * discount / 100 || price);
            setMerchInfo(val);
        }
    }, []);

    // 🔥 Если есть SSR данные - используем их
    useEffect(() => {
        if (initialData) {
            setMerchInfoHandler(initialData);
            isHydrated.current = true;
            dispatch(finishLoading());
        }
    }, [initialData, setMerchInfoHandler, dispatch]);

    // 🔥 Если нет SSR данных - загружаем на клиенте (fallback)
    useEffect(() => {
        if (isHydrated.current) return;
        
        if (product) {
            getMerchInfo(product, (data) => {
                dispatch(finishLoading());
                setMerchInfoHandler(data);
                isHydrated.current = true;
            });
        }
    }, [product, setMerchInfoHandler, dispatch]);

    const priceChangeHandler = useCallback((index: string) => {
        const priceBlock = pricesArr.current[index];
        setCurrentPrice(priceBlock.price - (priceBlock.discount ?? 0));
        currentDiscount.current = pricesArr.current[index].discount ?? 0;
        currentSize.current = index;
        currentPriceDiscount.current = priceBlock.price;
    }, []);

    const handleBuyClick = useCallback(() => {
        const data = {
            id: Number(product),
            size: String(currentSize.current),
            price: currentPrice,
            name: merchInfo.name,
            image_path: merchInfo.image_path
        };

        createPreorder(data, (hash) => {
            navigate(`/form/${hash}`);
            dispatch(cartCountAction(1));
        });
    }, [product, router, merchInfo, currentPrice]);

    const handleAddToCart = useCallback(() => {
        const cart = getCookie("cart");
        const data = {
            id: Number(product),
            size: currentSize.current,
            price: currentPrice,
            name: merchInfo.name,
            image_path: merchInfo.image_path
        };

        if (cart) {
            updatePreorder({ ...data, hashUrl: cart }, () => {
                dispatch(cartCountAction(cartCount + 1));
            });
        } else {
            createPreorder(data, () => {
                dispatch(cartCountAction(cartCount + 1));
            });
        }
    }, [product, cartCount, dispatch, merchInfo, currentPrice]);

    const imageContent = useMemo(() => {
        let count = 1;
        let content = [];
        while (count <= merchInfo.image_count) {
            content.push(
                <div key={count} style={{ width: "100%", flexShrink: 0, height: "100%" }}>
                    <ImagePresantationBlock 
                        image={merchInfo.image_path + "/img" + count + "." + merchInfo.image_extansion} 
                    />
                </div>
            );
            count++;
        }
        return content;
    }, [merchInfo]);

    const lineElements = useMemo(() => {
        const elements = [];
        if (merchInfo.line_products && merchInfo.line_products.length > 1) {
            merchInfo.line_products.forEach((el, index) => {
                if (el.id !== merchInfo.id) {
                    elements.push(
                        <img
                            onClick={() => {
                                navigate('/product/' + el.id);
                            }}
                            key={index}
                            className={s.lineImage}
                            alt={merchInfo.line}
                            src={el.image_path}
                        />
                    );
                }
            });
            return (
                <div className={s.modelContainer}>
                    <div className={s.modelHeader}>
                        {"Модель " + merchInfo.line + " (" + merchInfo.line_products[0].total_count + ")"}
                    </div>
                    <div className={s.imagesGrid}>
                        {elements}
                    </div>
                </div>
            );
        }
        return null;
    }, [merchInfo, router]);

    const renderImagePresentation = useCallback(() => {
        if (merchInfo.image_count > 0) {
            return widthProps
                ? <ContentSlider content={imageContent} />
                : <ImagePresantation 
                    onClick={() => setActiveProductsModal(true)} 
                    image_count={merchInfo.image_count} 
                    image_path={merchInfo.image_path} 
                    extansion={merchInfo.image_extansion} 
                />;
        }
        return null;
    }, [merchInfo.image_path, merchInfo.image_count, merchInfo.image_extansion, widthProps, imageContent]);

    const tableInfo = useMemo(() => {
        let data = SIZE_TABLES[merchType.current];
        if (data) {
            data = data[bodytype.current] || SIZE_TABLES[merchType.current];
        }
        if (!data) {
            return {
                sizes: {},
                table: [{ table: [], title: "" }],
                comboTable: [{ table: [], title: "" }]
            };
        }
        return data;
    }, [merchType.current, bodytype.current]);

    const tableIcon = useMemo(() => {
        switch (merchType.current) {
            case "sneakers":
                return <Shoe className={s.sizeLabel} onClick={() => setActiveModal(true)} />;
            case "clothes":
                return <Clothes className={s.sizeLabel} onClick={() => setActiveModal(true)} />;
            default: 
                return null;
        }
    }, [merchType.current]);

    return (
        <div>
            <div className={widthProps ? s.mainWrapVertical : s.mainWrap}>
                <div className={widthProps ? s.topPart : s.leftPart} style={widthProps ? { width: "100%" } : {}}>
                    {renderImagePresentation()}
                    {widthProps ? null : (
                        <div 
                            onClick={() => {
                                const firm = Object.values(firmMap).find(f => f.name === merchInfo.firm);
                                if (firm) {
                                    navigate(`/search?brand=${firm.slug}`);
                                }
                            }} 
                            className={s.firmInfoHolder}
                        >
                            <img className={s.firmImage} src={"/images/brandLogos/" + merchInfo.firm + "/image.png"} alt="" />
                            <span className={s.firmName}>{merchInfo.firm}</span>
                        </div>
                    )}
                </div>

                <div className={s.controllPanel}>
                    <h1 className={s.merchName}>{merchInfo.name}</h1>

                    {currentPrice ? (
                        <div className={s.mainPriceHolder}>
                            {currentDiscount.current > 0 && (
                                <>
                                    <span className={s.discountPrice}>
                                        {toPrice(currentPriceDiscount.current)}
                                    </span>
                                    <span className={s.discountPerce}>
                                        -{currentDiscount.current}%
                                    </span>
                                </>
                            )}
                            <span>{toPrice(currentPrice)}</span>
                        </div>
                    ) : null}

                    {merchType.current !== "solomerch" && (
                        <PriceHolder
                            onChange={priceChangeHandler}
                            elems={pricesArr.current}
                        />
                    )}
                    
                    <div>{lineElements}</div>

                    {emptyPage ? (
                        <div className={s.buttonGroup}>Товар отсутствует</div>
                    ) : (
                        <div className={s.buttonGroup}>
                            <div className={s.articleHolder}>
                                <div className={s.article} title={"Размеры"}>
                                    <span className={s.articleText}>{merchInfo.article}</span>
                                    <CopySvg className={s.articleBtn} />
                                </div>
                                <div style={{ display: "flex" }}>
                                    {widthProps ? (
                                        <div 
                                            onClick={() => {
                                                const firm = Object.values(firmMap).find(f => f.name === merchInfo.firm);
                                                if (firm) {
                                                    navigate(`/search?brand=${firm.slug}`);
                                                }
                                            }} 
                                            className={s.firmInfoHolder}
                                        >
                                            <img className={s.firmImage} src={"/images/brandLogos/" + merchInfo.firm + "/image.png"} alt="" />
                                            <span className={s.firmName}>{merchInfo.firm}</span>
                                        </div>
                                    ) : null}
                                    {tableIcon}
                                </div>
                            </div>

                            <Button
                                text="Купить"
                                className={`btnStyle ${s.buyMerch}`}
                                onClick={handleBuyClick}
                            />
                            <Button
                                text="Добавить в корзину"
                                className={`btnStyle ${s.addMerch}`}
                                onClick={handleAddToCart}
                                disabled={emptyPage}
                            />
                        </div>
                    )}

                    <AbstractInfo />
                </div>

                <Modal onChange={setActiveModal} active={activeModal}>
                    <div className={s.scrollContainer}>
                        <Scroller transparentThumb={true} onlyVertical={true} className={s.scrollStyle}>
                            <TableWithComboboxColumn
                                className={s.modalTable}
                                {...tableInfo}
                            />
                        </Scroller>
                    </div>
                </Modal>
                <Modal onChange={setActiveProductsModal} active={activeProductsModal}>
                    <ContentSlider content={imageContent} />
                </Modal>
            </div>
        </div>
    );
};

export default memo(ProductsInfo);