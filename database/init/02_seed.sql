INSERT INTO urls (original_url, regex, replacement_url)
VALUES
    ('x.com', '^https?://(?:www\.)?x\.com/([A-Za-z0-9_]{1,15})/status/([0-9]+)(/(?:photo|video)/[0-9]+)?/?(?:\?[^#\s<>]*)?(?:#[^\s<>]*)?$', 'https://vxtwitter.com/$1/status/$2$3'),
    ('twitter.com', '^https?://(?:www\.)?twitter\.com/([A-Za-z0-9_]{1,15})/status/([0-9]+)(/(?:photo|video)/[0-9]+)?/?(?:\?[^#\s<>]*)?(?:#[^\s<>]*)?$', 'https://vxtwitter.com/$1/status/$2$3'),
    ('instagram.com', '^https?://(?:www\.)?instagram\.com/(p|reel)/([A-Za-z0-9_-]+)/?(?:\?[^#\s<>]*)?(?:#[^\s<>]*)?$', 'https://ddinstagram.com/$1/$2'),
    ('tiktok.com', '^https?://(?:www\.)?tiktok\.com/@([A-Za-z0-9_.]+)/video/([0-9]+)/?(?:\?[^#\s<>]*)?(?:#[^\s<>]*)?$', 'https://vxtiktok.com/@$1/video/$2')
ON CONFLICT (original_url) DO NOTHING;
