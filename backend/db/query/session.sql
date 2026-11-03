-- name: InsertSession :exec
INSERT INTO public.uniquecustomers (
    session_id, visitor_id, ip_hash, user_agent
) VALUES (
    $1, $2, $3, $4
)
ON CONFLICT (session_id) DO NOTHING;

-- name: TouchSession :exec
UPDATE public.uniquecustomers
SET last_seen_at = NOW()
WHERE session_id = $1;

-- name: GetSession :one
SELECT id, session_id, visitor_id, first_seen_at, last_seen_at, ip_hash, user_agent
FROM public.uniquecustomers
WHERE session_id = $1;

-- name: CountSessionsSince :one
SELECT COUNT(*)::bigint
FROM public.uniquecustomers
WHERE first_seen_at > $1;

-- name: CountUniqueVisitorsSince :one
SELECT COUNT(DISTINCT visitor_id)::bigint
FROM public.uniquecustomers
WHERE first_seen_at > $1;

-- name: CountUniqueIPsSince :one
SELECT COUNT(DISTINCT ip_hash)::bigint
FROM public.uniquecustomers
WHERE ip_hash IS NOT NULL
  AND first_seen_at > $1;

-- name: DeleteOldSessions :execrows
DELETE FROM public.uniquecustomers
WHERE last_seen_at < NOW() - $1::interval;


-- name: RecordProductView :exec
INSERT INTO public.product_view_events (
    product_id, session_id, customer_id, event_type
) VALUES (
    $1, $2, $3, 'view'
)
ON CONFLICT (session_id, product_id, event_type) DO NOTHING;
-- name: RecordProductEvent :exec
INSERT INTO public.product_view_events (
    product_id, session_id, customer_id, event_type
) VALUES (
    $1, $2, $3, $4
);

-- name: GetUserHistoryIDs :many
SELECT DISTINCT ON (pve.product_id)
       pve.product_id
FROM public.product_view_events pve
JOIN public.products p ON p.id = pve.product_id
WHERE pve.customer_id = $1
  AND pve.event_type = 'view'
  AND p.status = 'active'
  AND p.deleted_at IS NULL
ORDER BY pve.product_id, pve.created_at DESC
LIMIT $2;



-- name: GetSessionHistory :many
SELECT p.id,
       p.name,
       p.image_path,
       p.minprice,
       p.maxprice,
       MAX(pve.created_at) AS last_viewed
FROM public.product_view_events pve
JOIN public.products p ON p.id = pve.product_id
WHERE pve.session_id = $1
  AND pve.event_type = 'view'
  AND p.status = 'active'
  AND p.deleted_at IS NULL
GROUP BY p.id, p.name, p.image_path, p.minprice, p.maxprice
ORDER BY last_viewed DESC
LIMIT $2;

-- name: GetRelatedProducts :many
SELECT p.id,
       p.name,
       p.image_path,
       p.minprice,
       p.maxprice,
       COUNT(DISTINCT a.session_id)::float AS score
FROM public.product_view_events a
JOIN public.product_view_events b
  ON a.session_id = b.session_id
 AND a.product_id <> b.product_id
JOIN public.products p ON p.id = b.product_id
WHERE a.product_id = $1
  AND a.event_type = 'view'
  AND b.event_type = 'view'
  AND a.created_at > NOW() - INTERVAL '30 days'
  AND b.created_at > NOW() - INTERVAL '30 days'
  AND p.status = 'active'
  AND p.deleted_at IS NULL
GROUP BY p.id, p.name, p.image_path, p.minprice, p.maxprice
ORDER BY score DESC
LIMIT $2;

-- name: DeleteOldProductEvents :execrows
DELETE FROM public.product_view_events
WHERE created_at < NOW() - $1::interval;


