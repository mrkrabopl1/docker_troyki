-- -- migration файл
-- CREATE TABLE IF NOT EXISTS newsletter_subscribers (
--     id SERIAL PRIMARY KEY,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'unsubscribed')),
--     verification_token VARCHAR(64) NOT NULL UNIQUE,
--     token_expires_at TIMESTAMP NOT NULL,
--     verified_at TIMESTAMP,
--     subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     ip_address VARCHAR(45),
--     user_agent TEXT
-- );

-- -- Индекс для быстрого поиска по токену
-- CREATE INDEX idx_newsletter_verification_token ON newsletter_subscribers(verification_token);
-- CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);



UPDATE public.products
SET firm = CASE firm
    WHEN '361' THEN '361°'
    WHEN 'adidas' THEN 'Adidas'
    WHEN 'anta' THEN 'ANTA'
    WHEN 'arcterix' THEN 'Arcterix'
    WHEN 'asics' THEN 'ASICS'
    WHEN 'atry' THEN 'Atry'
    WHEN 'balenciaga' THEN 'Balenciaga'
    WHEN 'birkenstock' THEN 'Birkenstock'
    WHEN 'camel' THEN 'CAMEL'
    WHEN 'carhartt' THEN 'Carhartt WIP'
    WHEN 'casio' THEN 'CASIO'
    WHEN 'cat' THEN 'CAT'
    WHEN 'champion' THEN 'Champion'
    WHEN 'chanel' THEN 'CHANEL'
    WHEN 'clarks' THEN 'Clarks'
    WHEN 'clot' THEN 'CLOT'
    WHEN 'coach' THEN 'COACH'
    WHEN 'columbia' THEN 'Columbia'
    WHEN 'converse' THEN 'Converse'
    WHEN 'crocs' THEN 'Crocs'
    WHEN 'diesel' THEN 'DIESEL'
    WHEN 'dior' THEN 'DIOR'
    WHEN 'disney' THEN 'Disney'
    WHEN 'doraemon' THEN 'Doraemon'
    WHEN 'ferragamo' THEN 'Ferragamo'
    WHEN 'fila' THEN 'FILA'
    WHEN 'gucci' THEN 'GUCCI'
    WHEN 'hermes' THEN 'HERMES'
    WHEN 'jordan' THEN 'Jordan'
    WHEN 'keen' THEN 'Keen'
    WHEN 'lining' THEN 'LINING'
    WHEN 'lululemon' THEN 'Lululemon'
    WHEN 'mizuno' THEN 'Mizuno'
    WHEN 'mlb' THEN 'MLB'
    WHEN 'nike' THEN 'Nike'
    WHEN 'peak' THEN 'PEAK'
    WHEN 'puma' THEN 'PUMA'
    WHEN 'reebok' THEN 'Reebok'
    WHEN 'salomon' THEN 'SALOMON'
    WHEN 'skechers' THEN 'Skechers'
    WHEN 'supreme' THEN 'Supreme'
    WHEN 'swarovski' THEN 'Swarovski'
    WHEN 'timberland' THEN 'Timberland'
    WHEN 'ugg' THEN 'UGG'
    WHEN 'vans' THEN 'Vans'
    WHEN 'yeezy' THEN 'YEEZY'
    ELSE firm
END
WHERE firm IN (
    '361', 'adidas', 'anta', 'arcterix', 'asics', 'atry', 'balenciaga', 
    'birkenstock', 'camel', 'carhartt', 'casio', 'cat', 'champion', 
    'chanel', 'clarks', 'clot', 'coach', 'columbia', 'converse', 'crocs',
    'diesel', 'dior', 'disney', 'doraemon', 'ferragamo', 'fila', 'gucci',
    'hermes', 'jordan', 'keen', 'lining', 'lululemon', 'mizuno', 'mlb',
    'nike', 'peak', 'puma', 'reebok', 'salomon', 'skechers', 'supreme',
    'swarovski', 'timberland', 'ugg', 'vans', 'yeezy'
);