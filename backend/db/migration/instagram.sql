CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,          
    is_active BOOLEAN DEFAULT TRUE,           
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска активных постов
CREATE INDEX idx_instagram_posts_active ON instagram_posts(is_active);