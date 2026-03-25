-- migration файл
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'unsubscribed')),
    verification_token VARCHAR(64) NOT NULL UNIQUE,
    token_expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Индекс для быстрого поиска по токену
CREATE INDEX idx_newsletter_verification_token ON newsletter_subscribers(verification_token);
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);