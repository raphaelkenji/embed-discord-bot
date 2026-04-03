CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    activated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    original_url VARCHAR(500) NOT NULL UNIQUE,
    regex VARCHAR(1000) NOT NULL,
    replacement_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_activated ON users(activated);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_urls_original_url ON urls(original_url);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);

INSERT INTO urls (original_url, regex, replacement_url) 
VALUES 
    ('x.com', 'https?://(?:www\.)?x\.com/([^/]+)/status/(\d+)(?:\?[^\\s]*)?', 'https://vxtwitter.com/$1/status/$2'),
    ('twitter.com', 'https?://(?:www\.)?twitter\.com/([^/]+)/status/(\d+)(?:\?[^\\s]*)?', 'https://vxtwitter.com/$1/status/$2'),
    ('instagram.com', 'https?://(?:www\.)?instagram\.com/(p|reel)/([^/?#]+)(?:/)?(?:\?[^\\s]*)?', 'https://ddinstagram.com/$1/$2'),
    ('tiktok.com', 'https?://(?:www\.)?tiktok\.com/@([^/]+)/video/(\d+)(?:\?[^\\s]*)?', 'https://vxtiktok.com/@$1/video/$2')
ON CONFLICT (original_url) DO UPDATE SET 
    regex = EXCLUDED.regex,
    replacement_url = EXCLUDED.replacement_url,
    updated_at = CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_urls_updated_at 
    BEFORE UPDATE ON urls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO discord_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO discord_user;