import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import ContentSlider from 'src/components/contentSlider/ContentSliderWithControl';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import s from "./style.module.css";

type ProductType = "snickers" | "clothes" | "solomerch";

interface ProductInfo {
    imgs: string[];
    name: string;
    info: Record<string, number>;
    discount?: Record<string, number>;
    firm?: string;
    id?: string;
    producttype: ProductType;
    minprice?: number;
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

    const [merchInfo, setMerchInfo] = useState<ProductInfo>({ imgs: [], name: "", info: {}, producttype: "snickers" });
    const [tableInfo, setTableInfo] = useState<SizeTable>({
        sizes: {},
        table: [{ table: [], title: "" }],
        comboTable: [{ table: [], title: "" }]
    });
    const [activeModal, setActiveModal] = useState(false);
    const [local] = useState("ru");

    const [currentPrice,setCurrentPrice] = useState<number>(0);
    const [emptyPage, setEmptyPage] = useState(false);
    const currentSize = useRef<string>("");
    const currentDiscount = useRef<number>(0);
    const currentPriceDiscount = useRef<number>(0);
    const pricesArr = useRef<Array<{ discount: number; price: number; size: string, availability: boolean }>>([]);
    const merchType = useRef<ProductType>("snickers");

    const setMerchInfoHandler = useCallback((val: ProductInfo) => {
        merchType.current = val.producttype;

        switch (val.producttype) {
            case "solomerch":
                processSoloMerch(val);
                break;
            case "snickers":
                processSnickers(val);
                break;
            case "clothes":
                processClothes(val);
                break;
        }
    }, []);

    const processSoloMerch = (val: ProductInfo) => {
        if (val.minprice === undefined || val.minprice === 0) {
            setEmptyPage(true);
        } else {
            pricesArr.current = [];
            const discount = val.discount?.[currentSize.current] || 0;
           setCurrentPrice((val.minprice || 0) - discount);
            setEmptyPage(false);
        }
        setMerchInfo(val);
    };

    const processSnickers = (val: ProductInfo) => {
        if (Object.keys(val.info).length === 0) {
            setEmptyPage(true);

        } else {
            pricesArr.current = [];
            currentSize.current = Object.keys(val.info)[0] || "";
            const discount = val.discount?.[currentSize.current] || 0;
            setCurrentPrice(Number(Object.values(val.info)[0]) || 0 - discount);

            pricesArr.current = Object.entries(val.info).map(([size, price]) => {
                const discount = val.discount?.[size] || 0;
                const ruSize = local === "ru"
                    ? String(sizes.sizes["ru"][sizes.sizes["us"].indexOf(Number(size))])
                    : size;

                return { discount, price, size: ruSize, availability: true };
            });
            setEmptyPage(false);
        }
        setMerchInfo(val);
    };

    const processClothes = (val: ProductInfo) => {
        if (Object.keys(val.info).length === 0) {
            setEmptyPage(true);
        } else {
            pricesArr.current = [];
            currentSize.current = Object.keys(val.info)[0] || "";
            const discount = val.discount?.[currentSize.current] || 0;
            setCurrentPrice(Number(Object.values(val.info)[0]) || 0 - discount);

            pricesArr.current = Object.entries(val.info).map(([size, price]) => ({
                discount: val.discount?.[size] || 0,
                price,
                size,
                availability: true
            }));
            setEmptyPage(false);
        }
        setMerchInfo(val);
    };

    const priceChangeHandler = useCallback((index: number) => {
        const priceBlock = pricesArr.current[index];
        setCurrentPrice(priceBlock.price - priceBlock.discount);
        currentDiscount.current = priceBlock.discount;

        if (local === "ru") {
            currentSize.current = String(
                tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(priceBlock.size))]
            );
        }

        currentPriceDiscount.current = priceBlock.price;
    }, [local, tableInfo.sizes]);

    const handleBuyClick = useCallback(() => {
        const data = {
            id: Number(snickers),
            size: String(currentSize.current) ,
            sourceTable: merchType.current
        };

        createPreorder(data, (hash) => {
            navigate(`/form/${hash}`);
        });
    }, [snickers, navigate]);

    const handleAddToCart = useCallback(() => {
        const cart = getCookie("cart");
        const data = {
            id: Number(snickers),
            size: currentSize.current ,
            sourceTable: merchType.current
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
    }, [snickers, cartCount, dispatch]);

    const renderImagePresentation = useCallback(() => {
        if (merchInfo.imgs.length > 1) {
            return widthProps
                ? <ContentSlider content={merchInfo.imgs.map(img => (
                    <div style={{ width: "100%", flexShrink: 0 }}>
                        <ImagePresantationBlock image={img} />
                    </div>
                ))} />
                : <ImagePresantation images={merchInfo.imgs} />;
        }
        return <ImagePresantationBlock image={merchInfo.imgs[0]} />;
    }, [merchInfo.imgs, widthProps]);

    useEffect(() => {
        if (snickers) {
            getMerchInfo(snickers, setMerchInfoHandler);
        }
    }, [snickers, setMerchInfoHandler]);

    useEffect(() => {
        getSizeTable(setTableInfo);
    }, []);

    return (
        <div>
            <div className={widthProps ? "" : s.mainWrap}>
                <div className={widthProps ? null : s.leftPart} style={widthProps ? { width: "100%" } : {}}>
                    {renderImagePresentation()}
                </div>

                <div className={s.controllPanel}>
                    {merchType.current === "snickers" && (
                        <Button text="размеры" onClick={() => setActiveModal(true)} />
                    )}

                    <h1 className={s.merchName}>{merchInfo.name}</h1>

                    <div>
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
                    </div>

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
            </div>

            <MerchComplexSliderField />
        </div>
    );
};

export default ProductsInfo;