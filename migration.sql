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