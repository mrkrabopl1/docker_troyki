  CREATE TEMP TABLE tmp_product_ids ON COMMIT DROP AS
    SELECT p.id, p.brand_id, p.line_id, p.type, p.bodytype, p.minprice, p.maxprice
    FROM products p
    JOIN brands b ON p.brand_id = b.id AND b.is_active = true
    WHERE p.status = 'active'
      AND ($1::int IS NULL OR p.type = $1)
      AND ($2::int IS NULL OR p.category = $2)
      AND ($3::text IS NULL OR p.name ILIKE '%' || $3 || '%')
      AND ($4::int IS NULL OR p.brand_id = $4)