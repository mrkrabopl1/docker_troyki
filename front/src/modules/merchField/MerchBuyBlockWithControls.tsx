import React, { memo } from 'react'
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom';
import CloseButton from 'src/components/button/CloseButton';
import NumStepInput from 'src/components/input/NumStepInput';

interface merchInterface {
    name: string;
    imgs: string;
    id: string;
    firm: string;
    price: string;
}

const MerchBuyBlockWithControls: React.FC<{
    data: merchInterface;
    onChange: (quantity: number) => void;
    quantity?: number;
    onDelete: () => void;
}> = memo(({
    data,
    onChange,
    quantity = 1,
    onDelete
}) => {
    const navigate = useNavigate();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const handleQuantityChange = (newQuantity: number) => {
        onChange(newQuantity);
    };

    return (
        <div>
            <div
                className={`${s.merchBuyLine} ${s.merchBuyBlock}`}
                onClick={() => navigate('/product/' + data.id)}
            >
                {/* Изображение товара */}
                <img
                    className={s.buyImg}
                    src={"/" + data.imgs}
                    alt={data.name}
                />

                {/* Информация о товаре */}
                <div className={s.productInfo}>
                    <p className={s.firmName}>{data.firm}</p>
                    <p className={s.merchName}>{data.name}</p>
                    <p className={s.sizeInfo}>Size US: {data.price}</p>
                    <div className={s.quantityControl}>
                        <NumStepInput
                            value={quantity}
                            onChange={handleQuantityChange}
                            min={1}
                            max={99}
                            step={1}
                            className={s.numInput}
                            disabled={false}
                            showValue={true}
                        />
                    </div>
                </div>

                {/* Управление количеством */}

                {/* Кнопка удаления */}
                <div className={s.deleteControl}>
                    <CloseButton
                        onClick={handleDelete}
                        buttonSize={30}
                    />
                </div>
            </div>
        </div>
    )
});

export default MerchBuyBlockWithControls;