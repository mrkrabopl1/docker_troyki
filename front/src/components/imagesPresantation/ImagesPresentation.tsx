import React, { useRef, useState, useCallback, memo, useEffect } from "react";
import s from "./style.module.css";
import ImagePresentationBlock from "./ImagePresentationBlock";
import ExpandedImagePresentation from "./ExpandedImagePresentation";
import { isDeepEqual } from 'src/global';

type ImagePresentationProps = {
    images: string[];
};

const ImagePresentation: React.FC<ImagePresentationProps> = ({ images }) => {
    const presentationRef = useRef<HTMLDivElement>(null);
    const [mainImage, setMainImage] = useState<string>(images[0]);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    // Reset main image when images prop changes
    useEffect(() => {
        setMainImage(images[0]);
    }, [images]);

    const handleThumbnailLeave = useCallback(() => {
        setMainImage(images[0]);
    }, [images]);

    const handleExpand = useCallback(() => {
        setIsExpanded(true);
    }, []);

    const handleCloseExpanded = useCallback(() => {
        setIsExpanded(false);
    }, []);

    const handleThumbnailHover = useCallback((image: string) => {
        setMainImage(image);
    }, []);

    return (
        <div ref={presentationRef} className={s.imgComponentWrap}>
            {isExpanded && (
                <ExpandedImagePresentation 
                    onClose={handleCloseExpanded} 
                    images={images} 
                />
            )}
            
            <ImagePresentationBlock 
                onClick={handleExpand} 
                image={mainImage} 
            />
            
            <div className={s.bottomFlexBlock}>
                {images.slice(1).map((image, index) => (
                    <div key={`${image}-${index}`} style={{height:"100%"}}>
                        <ImagePresentationBlock 
                            onOut={handleThumbnailLeave}
                            onClick={handleExpand}
                            onHover={handleThumbnailHover}
                            image={image}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const propsAreEqual = (prevProps: ImagePresentationProps, nextProps: ImagePresentationProps) => {
    return isDeepEqual(prevProps.images, nextProps.images);
};

export default memo(ImagePresentation, propsAreEqual);