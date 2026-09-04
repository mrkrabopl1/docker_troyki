CREATE TYPE news_item_type_enum AS ENUM ('header', 'text', 'image');

-- Основные блоки новостей
CREATE TABLE IF NOT EXISTS public.news_blocks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    cover_image_url VARCHAR(500),                -- Заглавное изображение/обложка
    cover_alt_text VARCHAR(255),                 -- Alt текст для обложки
    
    -- Статусы и даты
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Статистика
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    
    -- Порядок
    sort_order INTEGER DEFAULT 0
);

-- Элементы контента внутри блока
CREATE TABLE IF NOT EXISTS public.news_items (
    id SERIAL PRIMARY KEY,
    news_block_id INTEGER NOT NULL REFERENCES news_blocks(id) ON DELETE CASCADE,
    
    -- Тип элемента (используем ENUM)
    item_type news_item_type_enum NOT NULL,
    
    -- Контент
    content TEXT,                                -- Для header/text
    image_url VARCHAR(500),                      -- Для image
    link_url VARCHAR(500),                       -- Ссылка при клике на изображение
    
    -- Ориентация
    layout VARCHAR(20) DEFAULT 'horizontal' CHECK (layout IN ('horizontal', 'vertical')),
    
    -- Порядок внутри блока
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_news_blocks_active ON news_blocks(is_active);
CREATE INDEX idx_news_blocks_sort ON news_blocks(sort_order);
CREATE INDEX idx_news_blocks_published ON news_blocks(published_at DESC);
CREATE INDEX idx_news_items_block ON news_items(news_block_id);
CREATE INDEX idx_news_items_sort ON news_items(sort_order);

-- Комментарии
COMMENT ON TABLE news_blocks IS 'Основные блоки новостей';
COMMENT ON TABLE news_items IS 'Элементы контента внутри блока новостей';
COMMENT ON COLUMN news_blocks.cover_image_url IS 'Заглавное изображение/обложка блока';
COMMENT ON COLUMN news_blocks.views_count IS 'Количество просмотров';
COMMENT ON COLUMN news_blocks.likes_count IS 'Количество лайков';