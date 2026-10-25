-- -- Добавляем колонку для заглавного изображения (необязательная)
-- ALTER TABLE public.collections
-- ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500);

-- -- Добавляем колонку для типа отображения страницы коллекции
-- -- 1 = обычная (default), 2 = особенная (кастомный лейаут на сайте)
-- ALTER TABLE public.collections
-- ADD COLUMN IF NOT EXISTS display_type SMALLINT NOT NULL DEFAULT 1;

-- -- Ограничение: только допустимые значения
-- ALTER TABLE public.collections
-- ADD CONSTRAINT collections_display_type_check
-- CHECK (display_type IN (1, 2));

-- -- Индекс для быстрой фильтрации особенных коллекций (опционально)
-- CREATE INDEX IF NOT EXISTS idx_collections_display_type
-- ON public.collections(display_type);


ALTER TABLE public.products
    ADD COLUMN release_year SMALLINT,
    ADD COLUMN release_date DATE;


ALTER TABLE public.products
    ADD CONSTRAINT products_release_consistency CHECK (
        release_date IS NULL
        OR (release_year IS NOT NULL AND EXTRACT(YEAR FROM release_date) = release_year)
    );    