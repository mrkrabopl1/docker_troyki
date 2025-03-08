DB_URL=postgresql://postgres:s8121996@192.168.103.37:5432/troyki?sslmode=disable

migrateup:
	migrate -path db/migration -database "$(DB_URL)" -verbose up

migratedown:
	migrate -path db/migration -database "$(DB_URL)" -verbose down

mock:
	mockgen -package mockdb -destination db/mock/store.go github.com/mrkrabopl1/go_db/db/sqlc Store
	mockgen -package mockwk -destination worker/mock/distributor.go github.com/mrkrabopl1/go_db/worker TaskDistributor
	mockgen -package mockwk -destination worker/mock/processor.go github.com/mrkrabopl1/go_db/worker TaskProcessor