import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { cartCountAction } from 'src/store/reducers/menuSlice';
import { getMerchInfo, getSizeTable } from "src/providers/merchProvider";
import { createPreorder, updatePreorder } from 'src/providers/orderProvider';
import { getCookie } from 'src/global';
import { toPrice } from 'src/global';
import { sizes } from 'src/constFiles/size';
import PriceHolder from 'src/modules/PriceHolder/PriceHolder';
import ImagePresantation from 'src/components/imagesPresantation/ImagesPresentation';
import ImagePresantationBlock from "src/components/imagesPresantation/ImagePresentationBlock";
import Button from 'src/components/Button';
import Modal from 'src/components/modal/Modal';
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import Scroller from 'src/components/scroller/Scroller';
import TableWithComboboxColumn from 'src/components/table/simpleTable/TableWithComboboxColumn';
import ContentSlider from 'src/components/contentSlider/ContentSliderWithSwitcher';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import s from "./style.module.css";
import { ReactComponent as CopySvg } from "/public/copy.svg";
import SVGIcon from 'src/components/svgIcon/SvgIcon';

import merchType from 'src/types/merchType';

type ProductType = "snickers" | "clothes" | "solomerch";

interface ProductInfo {
    imgs: string[];
    name: string;
    info: merchType;
    discount?: Record<string, number>;
    store?: Record<string, number>;
    firm?: string;
    id?: string;
    producttype: ProductType;
    minprice?: number;
    article: string;
}

interface SizeTable {
    sizes: Record<string, number[]>;
    table: Array<{ title: string; subtitle?: string; table: string[] }>;
    comboTable: Array<{ title: string; subtitle?: string; table: string[] }>;
}

const PRICE_MATCH_TEXT = "Если вы нашли данную модель где-либо в наличии по более низкой цене — пришлите нам ссылку на данную модель в другом магазине. Мы будем рады предложить вам скидку, компенсирующую разницу в стоимости, и лучшую цену относительно конкурентов. Обратите внимание, что акция распространяется только на российские платформы.";

const ProductsInfo: React.FC = () => {

    const { snickers } = useParams<{ snickers: string }>();
    const { widthProps } = useAppSelector(state => state.resizeReducer);
    const { cartCount } = useAppSelector(state => state.menuReducer);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [merchInfo, setMerchInfo] = useState<ProductInfo>({ article: "", imgs: [], name: "", info: {}, producttype: "snickers" });
    console.log("render ProductsInfo", merchInfo);
    const [tableInfo, setTableInfo] = useState<SizeTable>({
        sizes: {},
        table: [{ table: [], title: "" }],
        comboTable: [{ table: [], title: "" }]
    });
    const [activeModal, setActiveModal] = useState(false);
    const [activeProductsModal, setActiveProductsModal] = useState(false);
    const [local] = useState("ru");

    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [emptyPage, setEmptyPage] = useState(false);
    const currentSize = useRef<string>("");
    const currentDiscount = useRef<number>(0);
    const currentPriceDiscount = useRef<number>(0);
    const pricesArr = useRef<merchType>({});
    const merchType = useRef<ProductType>("snickers");

    const setMerchInfoHandler = useCallback((val: ProductInfo) => {
        merchType.current = val.producttype;

        processProducts(val);
    }, []);



    const processProducts = useCallback((val: ProductInfo) => {
        merchType.current = val.producttype;

        if (Object.keys(val.info).length === 0) {
            // ВСЕ обновления для случая "пусто"
            setEmptyPage(true);
            setMerchInfo(val);
            setCurrentPrice(0);
        } else {
            // ВСЕ обновления для случая "есть данные"
            pricesArr.current = val.info;
            val.discount && Object.entries(val.discount).forEach(data => {
                pricesArr.current[data[0]].discount = data[1]
            })

            currentSize.current = Object.keys(val.info)[0] || "";
            const discount = val.discount?.[currentSize.current] || 0;
            const price = Number(Object.values(val.info)[0]?.price) || 0;

            setEmptyPage(false);
            currentDiscount.current = discount;
            currentPriceDiscount.current = price;
            setCurrentPrice(price - discount);
            setMerchInfo(val);
        }
    }, []);


    const priceChangeHandler = useCallback((index: string) => {
        const priceBlock = pricesArr.current[index];
        setCurrentPrice(priceBlock.price - (priceBlock.discount ?? 0));
        currentDiscount.current = pricesArr.current[index].discount ?? 0;

        // if (local === "ru") {
        //     currentSize.current = String(
        //         tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(priceBlock.size))]
        //     );
        // }

        currentPriceDiscount.current = priceBlock.price;
    }, [local, tableInfo.sizes]);

    const handleBuyClick = useCallback(() => {
        const data = {
            id: Number(snickers),
            size: String(currentSize.current),
            price: currentPrice,
            name: merchInfo.name,
            image_path: merchInfo.imgs[0]
        };

        createPreorder(data, (hash) => {
            navigate(`/form/${hash}`);
            dispatch(cartCountAction(1));
        });
    }, [snickers, navigate, merchInfo, currentPrice]);

    const handleAddToCart = useCallback(() => {
        const cart = getCookie("cart");
        const data = {
            id: Number(snickers),
            size: currentSize.current,
            price: currentPrice,
            name: merchInfo.name,
            image_path: merchInfo.imgs[0]
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
    }, [snickers, cartCount, dispatch, merchInfo, currentPrice]);

    const renderImagePresentation = useCallback(() => {
        if (merchInfo.imgs.length > 1) {
            return widthProps
                ? <ContentSlider content={merchInfo.imgs.map(img => (
                    <div style={{ width: "100%", flexShrink: 0 }}>
                        <ImagePresantationBlock image={img} />
                    </div>
                ))} />
                : <ImagePresantation onClick={(ind) => {
                    setActiveProductsModal(true)
                }} images={merchInfo.imgs} />;
        }
        return <ImagePresantationBlock image={merchInfo.imgs[0]} />;
    }, [merchInfo.imgs, widthProps]);

    useEffect(() => {
        if (snickers) {
            getMerchInfo(snickers, setMerchInfoHandler);
        }
    }, [snickers, setMerchInfoHandler]);

    useEffect(() => {
        getSizeTable(merchType.current, setTableInfo);
    }, [merchType.current]);

    return (
        <div>
            <div className={widthProps ? "" : s.mainWrap}>
                <div className={widthProps ? null : s.leftPart} style={widthProps ? { width: "100%" } : {}}>
                    {renderImagePresentation()}
                    <div>
                        <img src={merchInfo.firm} alt="" />
                        <span>{merchInfo.firm}</span>
                    </div>
                </div>

                <div className={s.controllPanel}>

                    <h1 className={s.merchName}>{merchInfo.name}</h1>

                    {currentPrice ? <div>
                        {currentDiscount.current > 0 && (
                            <>
                                <span className={s.discountPrice}>
                                    {toPrice(currentPriceDiscount.current)}
                                </span>
                                <span className={s.discountPerce}>
                                    -{Math.round((currentDiscount.current / currentPriceDiscount.current) * 100)}%
                                </span>
                            </>
                        )}
                        <span>{toPrice(currentPrice)}</span>
                    </div> : null}

                    {merchType.current !== "solomerch" && (
                        <PriceHolder
                            onChange={priceChangeHandler}
                            elems={pricesArr.current}
                        />
                    )}

                    {
                        emptyPage ? <div className={s.buttonGroup}>
                            Товар отсутствует
                        </div> : <div className={s.buttonGroup}>
                            <div className={s.articleHolder}>
                                <div className={s.article}>
                                    <span className={s.articleText}>{merchInfo.article}</span>
                                    <CopySvg className={s.articleBtn} />
                                </div>
                                <div onClick={() => setActiveModal(true)} className={s.sizeLabel}>
                                    <SVGIcon spritePath='shoe_size' />
                                </div>
                            </div>
                            <Button
                                text="Купить"
                                className={`btnStyle ${s.buyMerch}`}
                                onClick={handleBuyClick}
                            />
                            <Button
                                text="Добавить в корзину"
                                className={`btnStyle ${s.buyMerch}`}
                                onClick={handleAddToCart}
                                disabled={emptyPage}
                            />
                        </div>
                    }


                    <DoubleInfoDrop
                        className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }}
                        info="ГАРАНТИЯ ЛУЧШЕЙ ЦЕНЫ"
                    >
                        <div>{PRICE_MATCH_TEXT}</div>
                    </DoubleInfoDrop>
                </div>

                <Modal onChange={setActiveModal} active={activeModal}>
                    <div className={s.scrollContainer}>
                        <Scroller className={s.scrollStyle}>
                            <TableWithComboboxColumn
                                className={s.modalTable}
                                {...tableInfo}
                            />
                        </Scroller>
                    </div>
                </Modal>
                <Modal onChange={setActiveProductsModal} active={activeProductsModal}>
                    <ContentSlider className={{ holder: s.modalImageHolder, slider: s.modalSlider }} content={merchInfo.imgs.map(img => (
                        <div style={{ width: "100%", flexShrink: 0, height: "100%" }}>
                            <ImagePresantationBlock image={img} />
                        </div>
                    ))} />
                </Modal>
            </div>

            <MerchComplexSliderField />
        </div>
    );
};

export default memo(ProductsInfo);