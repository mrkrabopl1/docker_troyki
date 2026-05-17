# ============================================
# Конфигурация
# ============================================
DB_HOST ?= 172.30.48.1
DB_PORT ?= 5432
DB_USER ?= postgres
DB_PASSWORD ?= s8121996
DB_NAME ?= troyki
DB_SSL ?= disable

DB_URL_MIGRATE = postgresql://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL)&x-multi-statement=true
DB_URL = postgresql://postgres:s8121996@172.30.48.1:5432/troyki?sslmode=disable
MIGRATION_PATH = db/migration

# Цвета для вывода
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m

.PHONY: help migrate-up migrate-down migrate-fresh migrate-status migrate-version \
        migrate-new migrate-force migrate-fix migrate-list migrate-reset

help:
	@echo "$(GREEN)Доступные команды:$(NC)"
	@echo "  $(YELLOW)migrate-up$(NC)       - Применить все миграции"
	@echo "  $(YELLOW)migrate-down$(NC)     - Откатить все миграции"
	@echo "  $(YELLOW)migrate-fresh$(NC)    - Откатить и применить заново"
	@echo "  $(YELLOW)migrate-status$(NC)   - Показать статус миграций"
	@echo "  $(YELLOW)migrate-version$(NC)  - Показать текущую версию"
	@echo "  $(YELLOW)migrate-new$(NC)      - Создать новую миграцию (make migrate-new name=add_column)"
	@echo "  $(YELLOW)migrate-force$(NC)    - Принудительно установить версию"
	@echo "  $(YELLOW)migrate-fix$(NC)      - Исправить dirty состояние"
	@echo "  $(YELLOW)migrate-list$(NC)     - Показать список миграций"
	@echo "  $(YELLOW)migrate-reset$(NC)    - Полный сброс БД (ОСТОРОЖНО!)"

# Применить все миграции
migrate-up:
	@echo "$(GREEN)🚀 Applying all migrations...$(NC)"
	migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" -verbose up

# Откатить все миграции
migrate-down:
	@echo "$(RED)⚠️  Rolling back all migrations...$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" -verbose down -all; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

# Полное обновление (откат + накат)
migrate-fresh: migrate-down migrate-up
	@echo "$(GREEN)✅ Database refreshed successfully!$(NC)"

# Показать статус
migrate-status:
	@echo "$(GREEN)📊 Migration status:$(NC)"
	@migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" version

# Показать версию
migrate-version:
	@migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" version

# Создать новую миграцию
migrate-new:
	@if [ -z "$(name)" ]; then \
		echo "$(RED)❌ Please provide migration name: make migrate-new name=add_column$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)📝 Creating migration: $(name)$(NC)"
	@migrate create -ext sql -dir $(MIGRATION_PATH) -seq $(name)

# Принудительно установить версию (для исправления)
migrate-force:
	@read -p "Enter version number to force: " version; \
	migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" force $$version

# Исправить dirty состояние
migrate-fix:
	@echo "$(YELLOW)🔧 Fixing dirty state...$(NC)"
	@version=$$(migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" version 2>&1 | grep -oE '[0-9]+' | head -1); \
	if [ -n "$$version" ]; then \
		migrate -path $(MIGRATION_PATH) -database "$(DB_URL_MIGRATE)" force $$version; \
		echo "$(GREEN)✅ Fixed to version $$version$(NC)"; \
	else \
		echo "$(RED)❌ Could not determine version$(NC)"; \
	fi

# Показать список миграций
migrate-list:
	@echo "$(GREEN)📁 Migration files:$(NC)"
	@ls -1 $(MIGRATION_PATH)/*.up.sql | sed 's/.*\///' | sed 's/.up.sql//'

# Полный сброс БД
migrate-reset:
	@echo "$(RED)🔥 DANGER: This will DROP and RECREATE the database!$(NC)"
	@read -p "Type 'DROP DATABASE' to confirm: " confirm; \
	if [ "$$confirm" = "DROP DATABASE" ]; then \
		echo "$(RED)Dropping database...$(NC)"; \
		dropdb -h $(DB_HOST) -U $(DB_USER) $(DB_NAME) --if-exists; \
		echo "$(GREEN)Creating database...$(NC)"; \
		createdb -h $(DB_HOST) -U $(DB_USER) $(DB_NAME); \
		echo "$(GREEN)Running migrations...$(NC)"; \
		make migrate-up; \
		echo "$(GREEN)✅ Database reset complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

update_db_file:
	@if [ -z "$(file)" ]; then \
		echo "❌ Укажите файл: make update_db_file file=full_update_2026-03-18T10-21-59.sql"; \
		exit 1; \
	fi
	@echo "🚀 Применяем файл: $(SQL_DIR)$(file)"
	@psql "$(DB_URL)" -f "$(SQL_DIR)$(file)"
	@echo "✅ Обновление завершено!"	
