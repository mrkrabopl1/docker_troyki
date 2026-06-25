-- -- Удаляем старую
-- DROP TABLE IF EXISTS homepage_blocks;

-- -- Создаем новую
-- CREATE TABLE banners (
--     id SERIAL PRIMARY KEY,
--     title VARCHAR(255),                    -- для админа
--     image_url VARCHAR(500) NOT NULL,       -- путь к изображению
--     link_url VARCHAR(500) NOT NULL,                 -- ссылка
--     is_active   BOOLEAN NOT NULL DEFAULT true,        -- активен
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- Индекс для активных баннеров
-- CREATE INDEX idx_banners_active ON banners(is_active);
