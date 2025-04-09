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
-- name: InsertPreorderItems :one
INSERT INTO preorderItems (orderid, productid, size, quantity)
VALUES ($1, $2, $3, 1)
RETURNING id;
-- name: InsertPreorder :one
INSERT INTO preorder (hashurl, updatetime)
VALUES ($1, $2)
RETURNING id;
-- name: SelectQuantityFromPreorderItems :one
SELECT quantity
FROM preorderitems
WHERE orderid = $1
    AND size = $2
    AND productid = $3;
-- name: GetFullPreorderCount :one
SELECT coalesce(SUM(quantity), 0)
FROM preorderItems
WHERE orderid = $1;
-- name: UpdatePreorderItems :exec
UPDATE preorderItems
SET quantity = $1
WHERE orderid = $2
    AND size = $3
    AND productid = $4;
-- name: DeleteCartData :exec
DELETE FROM preorderitems
WHERE id = $1;
-- name: InsertOrder :one
INSERT INTO orders (
        status,
        deliveryPrice,
        deliveryType,
        unregistercustomerid,
        hash
    )
VALUES ($1, $2, $3, $4, $5)
RETURNING id;
-- name: GetOrder :one
SELECT id,
    hash,
    status,
    customerId,
    unregistercustomerid
FROM orders
WHERE hash = $1;
-- name: GetOrderById :one
SELECT id,
    hash,
    status,
    customerId,
    unregistercustomerid
FROM orders
WHERE id = $1;
-- name: InsertOrderItems :exec
INSERT INTO orderItems (productid, quantity, size, orderid)
VALUES ($1, $2, $3, $4);