// src/pages/news/NewsPage.tsx

import React, { useEffect, useState } from 'react';
import { useAppDispatch } from 'src/store/hooks/redux';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { NewsBlock, NewsItem } from 'src/types/news';
import { incrementNewsView, toggleNewsLike } from 'src/providers/adminNewsProvider';
import { useNavigate } from 'src/store/hooks/redux';
import s from './style.module.css';

interface NewsPageProps {
    initialData?: {
        news?: {
            block: NewsBlock;
            items: NewsItem[];
            related?: NewsBlock[];
        };
        pageInfo?: any[];
        menuInfo?: any;
    };
}

const NewsPage: React.FC<NewsPageProps> = ({ initialData }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    
    const block = initialData?.news?.block;
    const items = initialData?.news?.items || [];
    const related = initialData?.news?.related || [];

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(block?.likes_count || 0);
    const [viewsCount, setViewsCount] = useState(block?.views_count || 0);

    useEffect(() => {
        dispatch(finishLoading());
    }, [dispatch]);

    useEffect(() => {
        if (block?.id) {
            incrementNewsView(block.id);
            setViewsCount(prev => prev + 1);
        }
    }, [block?.id]);

    const handleLike = async () => {
        if (liked || !block?.id) return;
        try {
            await toggleNewsLike(block.id);
            setLiked(true);
            setLikesCount(prev => prev + 1);
        } catch (error) {
            console.error('Error liking news:', error);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const goBack = () => {
        navigate('/news');
    };

    const renderContent = () => {
        return items.map((item) => {
            switch (item.item_type) {
                case 'header':
                    return <h1 key={item.id} className={s.contentHeader}>{item.content}</h1>;
                case 'text':
                    return <p key={item.id} className={s.contentText}>{item.content}</p>;
                case 'image':
                    return (
                        <div key={item.id} className={s.contentImage}>
                            <img src={item.image_url!} alt={item.content || 'News image'} />
                            {item.content && <span className={s.imageCaption}>{item.content}</span>}
                            {item.link_url && (
                                <a href={item.link_url} target="_blank" rel="noopener noreferrer" className={s.imageLink}>
                                    🔗 Подробнее
                                </a>
                            )}
                        </div>
                    );
                default:
                    return null;
            }
        });
    };

    if (!block) {
        return <div className={s.notFound}>Новость не найдена</div>;
    }

    return (
        <div className={s.container}>
            {block.cover_image_url && (
                <div className={s.cover}>
                    <img src={block.cover_image_url} alt={block.cover_alt_text || block.title} />
                </div>
            )}

            <div className={s.content}>
                <h1 className={s.title}>{block.title}</h1>

                <div className={s.meta}>
                    <span>📅 {formatDate(block.published_at)}</span>
                    <span>👁️ {viewsCount}</span>
                    <button 
                        className={`${s.likeBtn} ${liked ? s.liked : ''}`}
                        onClick={handleLike}
                        disabled={liked}
                    >
                        ❤️ {likesCount}
                    </button>
                </div>

                <div className={s.body}>
                    {renderContent()}
                </div>

                <div className={s.navigation}>
                    <button onClick={goBack} className={s.backLink}>
                        ← Все новости
                    </button>
                </div>

                {related && related.length > 0 && (
                    <div className={s.related}>
                        <h2>Похожие новости</h2>
                        <div className={s.relatedGrid}>
                            {related.map((item) => (
                                <div 
                                    key={item.id} 
                                    className={s.relatedCard}
                                    onClick={() => navigate(`/news/${item.id}`)}
                                >
                                    {item.cover_image_url && (
                                        <img src={item.cover_image_url} alt={item.title} />
                                    )}
                                    <h3>{item.title}</h3>
                                    <span className={s.relatedDate}>
                                        {formatDate(item.published_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;