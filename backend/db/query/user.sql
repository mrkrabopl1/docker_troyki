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
        street,
        region,
        index,
        house,
        flat
    )
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
SELECT name,
    secondname,
    mail,
    phone,
    town,
    street,
    region,
    index,
    house,
    flat
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