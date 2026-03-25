-- name: DeleteVerification :exec
DELETE FROM verification
WHERE id = $1;
-- name: InsertVerification :exec
INSERT INTO verification (token, expire, customerId, deleteTime)
VALUES ($1, $2, $3, $4);
-- name: CheckMail :one
SELECT EXISTS (
        SELECT 1
        FROM customers
        WHERE mail = $1
    );
-- name: CreateCustomer :one
INSERT INTO customers (pass, mail)
VALUES ($1, $2)
RETURNING id;
-- name: GetCustomerData :one
SELECT name,
    secondname,
    mail,
    phone
FROM customers
WHERE id = $1;
-- name: GetVerification :one
SELECT id,
    expire,
    customerid
FROM verification
WHERE token = $1;
-- name: DeleteFromVerifivation :exec
DELETE FROM verification
WHERE id = $1;
-- name: GetBaseCustomerData :one
SELECT id,
    pass
FROM customers
WHERE mail = $1;
-- name: SetUnregisterCustomer :one
INSERT INTO unregistercustomer (
    name,
    secondname,
    mail,
    phone,
    town,
    index,
    street,
    region,
    house,
    flat,
    settlement,
    coordinates,
    deliverycomment
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11, $12,$13)
RETURNING id;
-- name: GetPassword :one
SELECT pass
FROM customers
WHERE id = $1;
-- name: UpdateCustomerPass :exec
UPDATE customers
SET pass = $1
WHERE id = $2;
-- name: GetCustomerId :one
SELECT id
FROM customers
WHERE mail = $1;
-- name: GetUnregisterCustomer :one
SELECT *
FROM unregistercustomer
WHERE id = $1;
-- name: CheckCustomerExistence :one
SELECT EXISTS (
        SELECT 1
        FROM unregistercustomer
        WHERE id = $1
            AND mail = $2
    );
-- name: SelectHistoryFromUniqueCustomer :one
SELECT history
FROM uniquecustomers
WHERE id = $1;
-- name: UpdateUniqueCustomerHistry :exec
UPDATE uniquecustomers
SET history = $1
WHERE id = $2;
-- name: CreateUniqueCustomer :one
INSERT INTO uniquecustomers (creationTime, history)
VALUES ($1, '{}')
RETURNING id;





-- query/newsletter.sql

-- name: CreateNewsletterSubscriber :one
INSERT INTO newsletter_subscribers (
    email,
    verification_token,
    token_expires_at,
    ip_address,
    user_agent,
    status
) VALUES (
    $1, $2, $3, $4, $5, 'pending'
) RETURNING *;

-- name: GetNewsletterSubscriberByEmail :one
SELECT * FROM newsletter_subscribers
WHERE email = $1;

-- name: GetNewsletterSubscriberByToken :one
SELECT * FROM newsletter_subscribers
WHERE verification_token = $1
AND status = 'pending'
AND token_expires_at > NOW();

-- name: VerifyNewsletterSubscriber :exec
UPDATE newsletter_subscribers
SET status = 'verified',
    verified_at = NOW()
WHERE verification_token = $1
AND status = 'pending'
AND token_expires_at > NOW();

-- name: UnsubscribeNewsletter :exec
UPDATE newsletter_subscribers
SET status = 'unsubscribed'
WHERE email = $1;

-- name: DeleteNewsletterSubscriber :exec
DELETE FROM newsletter_subscribers
WHERE email = $1;

-- name: GetVerifiedNewsletterSubscribers :many
SELECT email FROM newsletter_subscribers
WHERE status = 'verified'
ORDER BY subscribed_at DESC;

-- name: GetNewsletterVerifiedCount :one
SELECT COUNT(*) FROM newsletter_subscribers
WHERE status = 'verified';

-- name: GetNewsletterPendingCount :one
SELECT COUNT(*) FROM newsletter_subscribers
WHERE status = 'pending';

-- name: GetNewsletterUnsubscribedCount :one
SELECT COUNT(*) FROM newsletter_subscribers
WHERE status = 'unsubscribed';

-- name: GetNewsletterTotalCount :one
SELECT COUNT(*) FROM newsletter_subscribers;