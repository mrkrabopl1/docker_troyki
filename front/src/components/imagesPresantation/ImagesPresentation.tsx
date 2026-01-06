import React, { useRef, useState, useCallback, memo, useEffect, useMemo } from "react";
import s from "./style.module.css";
import ImagePresentationBlock from "./ImagePresentationBlock";
import ExpandedImagePresentation from "./ExpandedImagePresentation";
import { isDeepEqual } from 'src/global';

type ImagePresentationProps = {
    image_count: number;
    image_path: string,
    onClick?: (ind: number) => void;
};

const ImagePresentation: React.FC<ImagePresentationProps> = ({ 
    image_count, 
    image_path, 
    onClick
}) => {
    const presentationRef = useRef<HTMLDivElement>(null);
    const [mainImage, setMainImage] = useState<string>("");

    const cratePath = useCallback((i: number) => {
        return "images/" + image_path + "/img" + i + ".png";
    }, [image_path]);

    useEffect(() => {
        setMainImage(cratePath(1));
    }, [image_path, cratePath]);

    const handleThumbnailLeave = useCallback(() => {
        setMainImage(cratePath(1));
    }, [cratePath]);

    const handleExpand = useCallback((ind: number) => {
        onClick?.(ind);
    }, [onClick]);

    const handleThumbnailHover = useCallback((image: string) => {
        setMainImage(image);
    }, []);

    const content = useMemo(() => {
        let count = 1;
        const data = [];
        while (count <= image_count) {
            data.push(
                <div key={`${count}`} className={(mainImage === cratePath(count)) ? `${s.thumbnailWrapper} ${s.hover}` : s.thumbnailWrapper}>
                    <ImagePresentationBlock
                        onClick={() => handleExpand(count)}
                        onHover={handleThumbnailHover}
                        image={cratePath(count)}
                    />
                </div>
            );
            count++;
        }
        return data;
    }, [image_count, cratePath, handleExpand, handleThumbnailHover,mainImage]);

    return (
        <div ref={presentationRef} className={s.imgComponentWrap}>
            <div className={s.topBlock}>
                <ImagePresentationBlock
                    onClick={() => handleExpand(0)}
                    image={mainImage}
                />
            </div>

            <div className={s.bottomFlexBlock}>
                {content}
            </div>
        </div>
    );
};

const propsAreEqual = (prevProps: ImagePresentationProps, nextProps: ImagePresentationProps) => {
    return prevProps.image_path === nextProps.image_path;
};

export default memo(ImagePresentation, propsAreEqual);