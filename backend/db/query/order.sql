-- name: GetPreorderDataById :many
SELECT id,
    productid AS prid,
    size,
    quantity
FROM preorderItems
WHERE orderid = $1;
-- name: GetPreorderIdByHashUrl :one
SELECT id
FROM preorder
WHERE hashUrl = $1;
-- name: GetOrderDataById :many
SELECT id,
    productid AS prid,
    size,
    quantity
FROM orderItems
WHERE orderid = $1;
-- name: GetOrderIdByHashUrl :one
SELECT id
FROM orders
WHERE hash = $1;
-- name: InsertPreorder :one
INSERT INTO preorderItems (orderid, productid, size, quantity)
VALUES ($1, $2, $3, 1)
RETURNING id;
-- name: GetQuantityFromPreorderItems :one
SELECT quantity
FROM preorderitems
WHERE orderid = $1
    AND size = $2
    AND productid = $3;
-- name: GetFullPreorderCount :one
SELECT coalesce(SUM(quantity), 0)
FROM preorderItems
WHERE orderid = $1;
-- name: InsertOrder :one
INSERT INTO orders (
        orderdate,
        status,
        deliveryPrice,
        deliveryType,
        unregistercustomerid,
        hash
    )
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;
-- name: DeleteFromPreorderItems :exec
DELETE FROM preorderItems
WHERE orderid = $1;
-- name: GetOrder :one
SELECT id,
    status,
    customerId,
    hash,
    unregistercustomerid
FROM orders
WHERE id = $1;