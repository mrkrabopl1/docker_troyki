-- name: GetPreorderDataById :many
SELECT 
    id,
    ProductId,
    size,
    quantity,
    source_table
FROM preorderItems
WHERE orderid = $1;
-- name: GetPreorderIdByHashUrl :one
SELECT id
FROM preorder
WHERE hashUrl = $1;
-- name: GetOrderDataById :many
SELECT 
    id,
    ProductId,
    size,
    quantity,
    source_table
FROM orderItems
WHERE orderid = $1;
-- name: GetOrderAddressById :one
SELECT  id,
        town,
        street,
        region,
        index,
        house,
        flat,
        coordinates
FROM orderAddress
WHERE orderid = $1;
-- name: GetPreorderAddressById :one
SELECT  id,
        town,
        street,
        region,
        index,
        house,
        flat,
        coordinates
FROM preorderAddress
WHERE orderid = $1;
-- name: SetOrderAddress :one
INSERT INTO orderAddress (
        town,
        street,
        region,
        index,
        house,
        flat,
        orderId,
        coordinates
    )
VALUES ($1, $2, $3, $4,$5,$6,$7,$8)
RETURNING id;
-- name: SetPreorderAddress :one
INSERT INTO preorderAddress (
        town,
        street,
        region,
        index,
        house,
        flat,
        orderId,
        coordinates
    )
VALUES ($1, $2, $3, $4,$5,$6,$7,$8)
RETURNING id;
-- name: GetOrderIdByHashUrl :one
SELECT id
FROM orders
WHERE hash = $1;
-- name: InsertPreorderItem :one
INSERT INTO preorderItems (
    orderid,
    ProductId,
    size,
    source_table,
    quantity

) VALUES (
    $1,  -- orderid
    $2,  -- snickersId (0 преобразуется в NULL)
    $3,  -- soloMerchId (0 преобразуется в NULL)
    $4,  -- soloMerchId (0 преобразуется в NULL)
    1    -- quantity
)
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
INSERT INTO orderItems (
    orderid,
    ProductId,
    quantity,
    size,
    source_table
) VALUES (
    $1,  -- orderid
   $2,  -- snickersId (assuming 0 means NULL)
   $3,  -- soloMerchId (assuming 0 means NULL)
    $4,  -- quantity
    $5
);
-- name: GetOrderInfo :many
SELECT 
    (SELECT json_agg(a) FROM orderAddress a WHERE a.orderid = $1) AS address,
    (SELECT json_agg(i) FROM orderItems i WHERE i.orderid = $1) AS items;
-- name: GetPreorderInfo :many
SELECT 
    (SELECT json_agg(a) FROM preorderAddress a WHERE a.orderid = $1) AS address,
    (SELECT json_agg(i) FROM preorderItems i WHERE i.orderid = $1) AS items;

-- name: InsertPreorderItems :one
INSERT INTO preorderItems (orderid, productid, size, source_table, quantity)
VALUES ($1, $2, $3, $4, 1)
RETURNING id;    