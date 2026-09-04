-- name: RestoreDiscounts :exec
DELETE FROM discount
WHERE min_price = 0;