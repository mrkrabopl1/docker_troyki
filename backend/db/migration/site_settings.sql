CREATE TABLE fonts (
  id          SERIAL PRIMARY KEY,
  family      VARCHAR(100) NOT NULL,        -- 'Inter'
  slug        VARCHAR(100) NOT NULL UNIQUE, -- 'inter' — для URL/кеша
  url         TEXT NOT NULL,                -- '/uploads/fonts/inter-7f3a.woff2'
  weight      SMALLINT NOT NULL DEFAULT 400,
  style       VARCHAR(10) NOT NULL DEFAULT 'normal',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  version     INT NOT NULL DEFAULT 0,       -- cache busting
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- site_settings — глобальные настройки сайта (singleton)
-- Одна строка, id = 1. Всё остальное защищено CHECK.
-- ============================================================

CREATE TABLE site_settings (
  id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- ----------------------------------------------------------
  -- Логотип
  -- ----------------------------------------------------------
  logo_url        TEXT NOT NULL DEFAULT '/troyki_logo.svg',
  logo_alt        VARCHAR(255) NOT NULL DEFAULT 'TROYKI_BENCH',
  logo_version    INT NOT NULL DEFAULT 0,          -- cache busting: ++ при смене файла

  -- ----------------------------------------------------------
  -- Шрифты (ссылки на таблицу fonts)
  -- ----------------------------------------------------------
  font_body_id    INT REFERENCES fonts(id) ON DELETE SET NULL,
  font_display_id INT REFERENCES fonts(id) ON DELETE SET NULL,

  -- ----------------------------------------------------------
  -- Метаданные
  -- ----------------------------------------------------------
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Начальная строка (чтобы SSR не падал на пустой таблице)
-- ============================================================
INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;




ALTER TABLE fonts DROP CONSTRAINT IF EXISTS fonts_slug_key;
ALTER TABLE fonts ADD CONSTRAINT fonts_slug_weight_style_key UNIQUE (slug, weight, style);