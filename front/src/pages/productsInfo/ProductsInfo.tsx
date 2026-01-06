import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
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
import Scroller from 'src/components/scroller/Scroller';
import TableWithComboboxColumn from 'src/components/table/simpleTable/TableWithComboboxColumn';
import ContentSlider from 'src/components/contentSlider/ContentSliderWithSwitcher';
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
import s from "./style.module.css";
import { ReactComponent as CopySvg } from "/public/copy.svg";
import SVGIcon from 'src/components/svgIcon/SvgIcon';
import AbstractInfo from './pageBlocks/AbstractInfo';
import merchType from 'src/types/merchType';

type ProductType = "snickers" | "clothes" | "solomerch";

interface ProductInfo {
    image_count: number;
    image_path: string;
    name: string;
    line?: string,
    info: merchType;
    discount?: Record<string, number>;
    store?: Record<string, number>;
    firm?: string;
    id?: string;
    producttype: ProductType;
    minprice?: number;
    article: string;
    line_products?: any[]
}

interface SizeTable {
    sizes: Record<string, number[]>;
    table: Array<{ title: string; subtitle?: string; table: string[] }>;
    comboTable: Array<{ title: string; subtitle?: string; table: string[] }>;
}

const ProductsInfo: React.FC = () => {

    const { snickers } = useParams<{ snickers: string }>();
    const { widthProps } = useAppSelector(state => state.resizeReducer);
    const { cartCount } = useAppSelector(state => state.menuReducer);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const [merchInfo, setMerchInfo] = useState<ProductInfo>({ article: "", image_path: "", image_count: 0, name: "", info: {}, producttype: "snickers" });
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
        currentSize.current = index;
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
            image_path: merchInfo.image_path + "1.png"
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
    }, [snickers, cartCount, dispatch, merchInfo, currentPrice]);

    const imageContent = useMemo(() => {
        let count = 1;
        let content = [];
        while (count <= merchInfo.image_count) {
            content.push(<div style={{ width: "100%", flexShrink: 0, height: "100%" }}>
                <ImagePresantationBlock image={"images/" + merchInfo.image_path + "/img" + count + ".png"} />
            </div>)
            count++
        }
        return content
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
                            src={"images/" + el.image_path + "/img1.png"}
                        />
                    )
                }
            })
            return <div className={s.modelContainer}>
                <div className={s.modelHeader}>
                    {"Модель " + merchInfo.line + " (" + merchInfo.line_products[0].total_count + ")"}
                </div>
                <div className={s.imagesGrid}>
                    {elements}
                </div>
            </div>
        }
    }, [merchInfo]);


    const renderImagePresentation = useCallback(() => {
        if (merchInfo.image_count > 1) {
            return widthProps
                ? <ContentSlider content={imageContent} />
                : <ImagePresantation onClick={(ind) => {
                    setActiveProductsModal(true)
                }} image_count={merchInfo.image_count} image_path={merchInfo.image_path} />;
        }
        return <ImagePresantationBlock image={merchInfo.image_count[0]} />;
    }, [merchInfo.image_count, widthProps]);

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
            <div className={widthProps ? s.mainWrapVertical : s.mainWrap}>
                <div className={widthProps ? s.topPart : s.leftPart} style={widthProps ? { width: "100%" } : {}}>
                    {renderImagePresentation()}
                    {widthProps ? null: <div onClick={() => {
                        navigate(`/search?firm=${merchInfo.firm}`);
                    }} className={s.firmInfoHolder}>
                        <img className={s.firmImage} src={merchInfo.firm} alt="" />
                        <span className={s.firmName}>{merchInfo.firm}</span>
                    </div>}
                </div>

                <div className={s.controllPanel}>

                    <h1 className={s.merchName}>{merchInfo.name}</h1>

                    {currentPrice ? <div className={s.mainPriceHolder}>
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
                    <div>
                        {lineElements}
                    </div>

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
                                {widthProps ? <div onClick={() => {
                                    navigate(`/search?firm=${merchInfo.firm}`);
                                }} className={s.firmInfoHolder}>
                                    <img className={s.firmImage} src={merchInfo.firm} alt="" />
                                    <span className={s.firmName}>{merchInfo.firm}</span>
                                </div> : null}
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
                    }

                    <AbstractInfo />
                </div>

                <Modal onChange={setActiveModal} active={activeModal}>
                    <div className={s.scrollContainer}>
                        <Scroller onlyVertical={true} className={s.scrollStyle}>
                            <TableWithComboboxColumn
                                className={s.modalTable}
                                {...tableInfo}
                            />
                        </Scroller>
                    </div>
                </Modal>
                <Modal onChange={setActiveProductsModal} active={activeProductsModal}>
                    <ContentSlider className={{ holder: s.modalImageHolder, slider: s.modalSlider }} content={imageContent} />
                </Modal>
            </div>

            <MerchComplexSliderField />
        </div>
    );
};

export default memo(ProductsInfo);