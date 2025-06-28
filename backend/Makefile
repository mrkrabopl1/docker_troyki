DB_URL=postgresql://postgres:s8121996@192.168.1.112:5432/troyki?sslmode=disable

migrate_back:
	migrate -path db/migration -database "$(DB_URL)" force 1

migrate_back_all:
	migrate -path db/migration -database "$(DB_URL)" -verbose down -all	

migrate_version:
	migrate -path db/migration -database "$(DB_URL)" -verbose version

migrateup:
	migrate -path db/migration -database "$(DB_URL)" -verbose up

migratedown:
	migrate -path db/migration -database "$(DB_URL)" -verbose down

migrateup1:
	migrate -path db/migration -database "$(DB_URL)" -verbose up 1

migratedown1:
	migrate -path db/migration -database "$(DB_URL)" -verbose down 1	

new_migration:
	migrate create -ext sql -dir db/migration -seq $(name)	

mock:
	mockgen -package mockdb -destination db/mock/store.go github.com/mrkrabopl1//db/sqlc Store
	mockgen -package mockwk -destination worker/mock/distributor.go github.com/mrkrabopl1/go_db/worker TaskDistributor
	mockgen -package mockwk -destination worker/mock/processor.go github.com/mrkrabopl1/go_db/worker TaskProcessor
redis:
	sudo service redis-server start
