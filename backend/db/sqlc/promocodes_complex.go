package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/mrkrabopl1/go_db/util"
)

// CreateWelcomePromoCode создаёт персональный приветственный промокод для нового юзера.
// Скидка = 5% на весь заказ, действует 30 дней, одноразовый.
func (store *SQLStore) CreateWelcomePromoCode(
	ctx context.Context,
	customerID int32,
) (PromoCode, error) {
	code := fmt.Sprintf("WELCOME-%s", util.RandomString(8))

	now := time.Now()
	endsAt := now.Add(30 * 24 * time.Hour)

	promo, err := store.Queries.CreatePromoCode(ctx, CreatePromoCodeParams{
		Code:               code,
		Name:               pgtype.Text{String: "Приветственный промокод", Valid: true},
		Description:        pgtype.Text{String: "Скидка 5% на весь заказ", Valid: true},
		DiscountType:       "percent",
		DiscountValue:      500, // 5% * 100 — как в админке
		AppliesTo:          "global",
		CollectionID:       pgtype.Int4{Valid: false}, // NULL для global
		MinOrder:           pgtype.Int4{Int32: 0, Valid: true},
		MaxOrder:           pgtype.Int4{Int32: 0, Valid: true},
		MaxDiscount:        pgtype.Int4{Int32: 0, Valid: true},
		StartsAt:           pgtype.Timestamptz{Time: now, Valid: true},
		EndsAt:             pgtype.Timestamptz{Time: endsAt, Valid: true},
		UsageLimit:         pgtype.Int4{Int32: 1, Valid: true}, // одноразовый
		PerUserLimit:       pgtype.Int4{Int32: 1, Valid: true},
		IsActive:           pgtype.Bool{Bool: true, Valid: true},
		IssuedToCustomerID: pgtype.Int4{Int32: customerID, Valid: true},
	})
	if err != nil {
		return PromoCode{}, fmt.Errorf("failed to create welcome promo: %w", err)
	}

	return promo, nil
}
