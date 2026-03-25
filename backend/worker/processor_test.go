package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/hibiken/asynq"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

// Setup real Redis connection for testing
func setupTestRedis() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr: "localhost:6379", // Ensure Redis is running
		DB:   1,                // Use a separate DB for testing
	})
}

func TestAsynqSimple(t *testing.T) {
	ctx := context.Background()

	// 1. Очищаем Redis
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	err := rdb.FlushAll(ctx).Err()
	require.NoError(t, err)
	fmt.Println("Redis flushed successfully")
	// 2. Проверяем, что Redis доступен
	pong, err := rdb.Ping(ctx).Result()
	require.NoError(t, err)
	require.Equal(t, "PONG", pong)

	// 3. Пробуем asynq
	redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
	client := asynq.NewClient(redisOpt)
	defer client.Close()

	// 4. Простая задача
	task := asynq.NewTask("simple_test", []byte(`{"hello":"world"}`))

	// 5. Пробуем отправить с разными опциями
	t.Run("with_default_options", func(t *testing.T) {
		info, err := client.Enqueue(task)
		if err != nil {
			t.Logf("Ошибка с дефолтными опциями: %v", err)
			t.Fail()
		} else {
			t.Logf("Успех! ID задачи: %s", info.ID)
		}
	})

	t.Run("with_explicit_options", func(t *testing.T) {
		info, err := client.Enqueue(task,
			asynq.Queue("default"),
			asynq.MaxRetry(2),
			asynq.Timeout(10),
		)
		if err != nil {
			t.Logf("Ошибка с явными опциями: %v", err)
			t.Fail()
		} else {
			t.Logf("Успех! ID задачи: %s", info.ID)
		}
	})
}

// Clean up Redis after each test
func cleanupRedis(client *redis.Client) {
	client.FlushDB(context.Background()) // Clears all keys in the test DB
}

// Test SetMerchantInfo with real Redis
func TestSetProductsInfo(t *testing.T) {
	ctx := context.Background()
	redisClient := setupTestRedis()
	defer cleanupRedis(redisClient) // Ensure cleanup after test

	taskProcessor := &RedisTaskProcessor{redisClient: redisClient}

	// Sample merchant data
	merchant := db.ProductsInfoResponse{
		Name: "Acme Corp",
	}

	// Call SetMerchantInfo
	err := taskProcessor.SetProductsInfo(ctx, "1", merchant)

	// Assertions
	require.NoError(t, err)

	// Verify data in Redis
	result, err := taskProcessor.GetProductsInfo(ctx, "1") // <-- ИСПРАВЬ ЗДЕСЬ
	fmt.Println(result, err)
	require.NoError(t, err)
	require.NotEmpty(t, result)
}
func TestRedisConnection(t *testing.T) {
	ctx := context.Background()
	rdb := setupTestRedis()
	defer cleanupRedis(rdb)

	// Test ping
	pong, err := rdb.Ping(ctx).Result()
	require.NoError(t, err)
	require.Equal(t, "PONG", pong)
	fmt.Println("✅ Redis connected successfully")
}
func TestNewsletterPayloads(t *testing.T) {
	// Test PayloadSendNewsletterVerification
	verificationPayload := PayloadSendNewsletterVerification{
		Email:    "test@example.com",
		Token:    "test-token-123",
		Username: "Test User",
	}

	jsonData, err := json.Marshal(verificationPayload)
	require.NoError(t, err)
	require.Contains(t, string(jsonData), "test@example.com")
	require.Contains(t, string(jsonData), "test-token-123")
	fmt.Println("✅ Verification payload marshaled correctly")

	// Test PayloadSendNewsletterWelcome
	welcomePayload := PayloadSendNewsletterWelcome{
		Email:    "test@example.com",
		Username: "Test User",
	}

	jsonData, err = json.Marshal(welcomePayload)
	require.NoError(t, err)
	require.Contains(t, string(jsonData), "test@example.com")
	fmt.Println("✅ Welcome payload marshaled correctly")

	// Test PayloadSendNewsletterBroadcast
	broadcastPayload := PayloadSendNewsletterBroadcast{
		Subject: "Test Newsletter",
		Content: "<h1>Hello</h1>",
		Emails:  []string{"user1@example.com", "user2@example.com"},
	}

	jsonData, err = json.Marshal(broadcastPayload)
	require.NoError(t, err)
	require.Contains(t, string(jsonData), "Test Newsletter")
	require.Contains(t, string(jsonData), "user1@example.com")
	fmt.Println("✅ Broadcast payload marshaled correctly")
}

func TestNewsletterWithSimpleRedis(t *testing.T) {
	ctx := context.Background()

	// Очищаем Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   0,
	})
	err := rdb.FlushAll(ctx).Err()
	require.NoError(t, err)

	// Проверяем Redis
	pong, err := rdb.Ping(ctx).Result()
	require.NoError(t, err)
	require.Equal(t, "PONG", pong)
	fmt.Println("✅ Redis connected")

	// Симулируем задачу через простой Redis (без asynq)
	testPayload := PayloadSendNewsletterVerification{
		Email:    "test@example.com",
		Token:    "test-token-123456",
		Username: "Test User",
	}

	// Маршалим в JSON
	jsonData, err := json.Marshal(testPayload)
	require.NoError(t, err)

	// Сохраняем в Redis
	err = rdb.Set(ctx, "newsletter:task:test", jsonData, 1*time.Hour).Err()
	require.NoError(t, err)
	fmt.Println("✅ Task saved to Redis directly")

	// Получаем обратно
	result, err := rdb.Get(ctx, "newsletter:task:test").Result()
	require.NoError(t, err)
	fmt.Printf("✅ Retrieved from Redis: %s\n", result)

	// Деларим обратно
	var retrieved PayloadSendNewsletterVerification
	err = json.Unmarshal([]byte(result), &retrieved)
	require.NoError(t, err)
	require.Equal(t, testPayload.Email, retrieved.Email)
	fmt.Println("✅ JSON marshaling/unmarshaling works")
}

// TestNewsletterWithDifferentOptions - тест с разными опциями
func TestNewsletterWithDifferentOptions(t *testing.T) {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	err := rdb.FlushAll(ctx).Err()
	require.NoError(t, err)

	redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
	distributor := NewRedisTaskDistributor(redisOpt)

	// Тест 1: базовая отправка
	t.Run("basic_send", func(t *testing.T) {
		payload := &PayloadSendNewsletterVerification{
			Email:    "basic@example.com",
			Token:    "token-1",
			Username: "Basic User",
		}
		err := distributor.DistributeTaskSendNewsletterVerification(ctx, payload)
		require.NoError(t, err)
		fmt.Println("✅ Basic send successful")
	})

	// Тест 2: с указанием очереди
	t.Run("with_queue", func(t *testing.T) {
		payload := &PayloadSendNewsletterVerification{
			Email:    "queue@example.com",
			Token:    "token-2",
			Username: "Queue User",
		}
		err := distributor.DistributeTaskSendNewsletterVerification(ctx, payload, asynq.Queue("critical"))
		require.NoError(t, err)
		fmt.Println("✅ Queue send successful")
	})

	// Тест 3: с ретраями
	t.Run("with_retries", func(t *testing.T) {
		payload := &PayloadSendNewsletterVerification{
			Email:    "retry@example.com",
			Token:    "token-3",
			Username: "Retry User",
		}
		err := distributor.DistributeTaskSendNewsletterVerification(ctx, payload, asynq.MaxRetry(5))
		require.NoError(t, err)
		fmt.Println("✅ Retry send successful")
	})

	// Тест 4: с таймаутом
	t.Run("with_timeout", func(t *testing.T) {
		payload := &PayloadSendNewsletterVerification{
			Email:    "timeout@example.com",
			Token:    "token-4",
			Username: "Timeout User",
		}
		err := distributor.DistributeTaskSendNewsletterVerification(ctx, payload, asynq.Timeout(30*time.Second))
		require.NoError(t, err)
		fmt.Println("✅ Timeout send successful")
	})
}

// TestNewsletterBroadcastDirect - тест массовой рассылки
func TestNewsletterBroadcastDirect(t *testing.T) {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	err := rdb.FlushAll(ctx).Err()
	require.NoError(t, err)

	redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
	distributor := NewRedisTaskDistributor(redisOpt)

	// Тестовая рассылка
	emails := []string{
		"user1@example.com",
		"user2@example.com",
		"user3@example.com",
	}

	payload := &PayloadSendNewsletterBroadcast{
		Subject: "Test Newsletter",
		Content: "<h1>Hello Subscribers!</h1><p>This is a test.</p>",
		Emails:  emails,
	}

	fmt.Printf("📤 Sending broadcast to %d recipients...\n", len(emails))
	err = distributor.DistributeTaskSendNewsletterBroadcast(ctx, payload)

	if err != nil {
		fmt.Printf("❌ Broadcast error: %v\n", err)
		t.Fatalf("Failed to send broadcast: %v", err)
	}

	fmt.Println("✅ Broadcast task sent successfully")
}

// TestConcurrentNewsletterTasks - тест конкурентной отправки
func TestConcurrentNewsletterTasks(t *testing.T) {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	err := rdb.FlushAll(ctx).Err()
	require.NoError(t, err)

	redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
	distributor := NewRedisTaskDistributor(redisOpt)

	// Отправляем много задач одновременно
	concurrency := 20
	errChan := make(chan error, concurrency)

	for i := 0; i < concurrency; i++ {
		go func(id int) {
			payload := &PayloadSendNewsletterVerification{
				Email:    fmt.Sprintf("user%d@example.com", id),
				Token:    fmt.Sprintf("token-%d", id),
				Username: fmt.Sprintf("User %d", id),
			}
			err := distributor.DistributeTaskSendNewsletterVerification(ctx, payload)
			errChan <- err
		}(i)
	}

	// Собираем результаты
	successCount := 0
	failCount := 0

	for i := 0; i < concurrency; i++ {
		err := <-errChan
		if err != nil {
			fmt.Printf("❌ Task %d failed: %v\n", i, err)
			failCount++
		} else {
			successCount++
		}
	}

	fmt.Printf("✅ Concurrent test completed: %d success, %d failed\n", successCount, failCount)

	if failCount > 0 {
		t.Fatalf("Some tasks failed: %d failures", failCount)
	}
}

// TestRedisAndAsynqIntegration - интеграционный тест
func TestRedisAndAsynqIntegration(t *testing.T) {
	ctx := context.Background()

	// 1. Проверяем Redis
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	err := rdb.Ping(ctx).Err()
	require.NoError(t, err, "Redis should be available")

	// 2. Очищаем Redis
	err = rdb.FlushAll(ctx).Err()
	require.NoError(t, err)
	fmt.Println("✅ Redis ready and clean")

	// 3. Создаем клиент asynq
	redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
	client := asynq.NewClient(redisOpt)
	defer client.Close()

	// 4. Отправляем тестовую задачу
	task := asynq.NewTask("test:task", []byte(`{"test": "data"}`))
	info, err := client.Enqueue(task)
	require.NoError(t, err)
	fmt.Printf("✅ Test task enqueued: %s\n", info.ID)

	// 5. Отправляем задачу новостной рассылки
	newsletterTask := asynq.NewTask(TaskSendNewsletterVerification, []byte(`{
		"email": "integration@example.com",
		"token": "integrate-token",
		"username": "Integration Test"
	}`))

	info2, err := client.Enqueue(newsletterTask)
	require.NoError(t, err)
	fmt.Printf("✅ Newsletter task enqueued: %s\n", info2.ID)

	// 6. Проверяем, что задачи в Redis
	keys, _ := rdb.Keys(ctx, "*").Result()
	fmt.Printf("📦 Total Redis keys after tasks: %d\n", len(keys))

	// 7. Проверяем, что можно получить задачу через инспектор
	inspector := asynq.NewInspector(redisOpt)
	queues, err := inspector.Queues()
	require.NoError(t, err)
	fmt.Printf("📋 Available queues: %v\n", queues)

	for _, queue := range queues {
		stats, err := inspector.GetQueueInfo(queue)
		require.NoError(t, err)
		fmt.Printf("  Queue '%s': %d pending, %d processed, %d failed\n",
			queue, stats.Pending, stats.Processed, stats.Failed)
	}

	fmt.Println("✅ Integration test completed successfully")
}

func TestAsynqWithNewConfig(t *testing.T) {

	// Создаем клиент с новыми настройками
	redisOpt := asynq.RedisClientOpt{
		Addr:         "localhost:6379",
		DialTimeout:  10 * time.Second,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	client := asynq.NewClient(redisOpt)
	defer client.Close()

	// Пробуем отправить простую задачу
	task := asynq.NewTask("test:task", []byte(`{"test":"data"}`))
	info, err := client.Enqueue(task, asynq.Queue("default"))

	if err != nil {
		t.Logf("Error: %v", err)
		// Проверяем, не ошибка ли Lua
		// if contains(err.Error(), "redis eval error") {
		// 	t.Log("Lua script error detected - this is the known issue")
		// 	t.Skip("Skipping test due to asynq Lua script issue")
		// }
		require.NoError(t, err)
	} else {
		fmt.Printf("✅ Task sent successfully: %s\n", info.ID)
	}
}

func TestRedisLuaScript(t *testing.T) {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   0,
	})
	defer rdb.Close()

	// 1. Простой Lua скрипт
	t.Run("simple_lua", func(t *testing.T) {
		script := `
			local key = KEYS[1]
			local value = ARGV[1]
			redis.call('SET', key, value)
			return redis.call('GET', key)
		`

		result, err := rdb.Eval(ctx, script, []string{"test:lua"}, "hello-world").Result()
		require.NoError(t, err)
		require.Equal(t, "hello-world", result)
		fmt.Println("✅ Simple Lua script OK")
	})

	// 2. Скрипт с множеством аргументов (как в asynq)
	t.Run("complex_lua", func(t *testing.T) {
		// Это скрипт похожий на тот, что использует asynq
		script := `
			local key = KEYS[1]
			local field = ARGV[1]
			local value = ARGV[2]
			local expire = ARGV[3]
			
			redis.call('HSET', key, field, value)
			if tonumber(expire) > 0 then
				redis.call('EXPIRE', key, expire)
			end
			return redis.call('HGET', key, field)
		`

		result, err := rdb.Eval(ctx, script,
			[]string{"test:hash"},
			"field1", "value1", "3600",
		).Result()

		if err != nil {
			fmt.Printf("❌ Lua script error: %v\n", err)
			t.Logf("This is the same type of error as asynq!")
			t.Fail()
		} else {
			require.Equal(t, "value1", result)
			fmt.Println("✅ Complex Lua script OK")
		}
	})

	// 3. Скрипт с несколькими KEYS и ARGV (как в asynq)
	t.Run("multiple_args_lua", func(t *testing.T) {
		// Скрипт, который использует несколько ключей и аргументов
		script := `
			local queue_key = KEYS[1]
			local processing_key = KEYS[2]
			local task = ARGV[1]
			local timeout = ARGV[2]
			
			-- Добавляем задачу в очередь
			redis.call('LPUSH', queue_key, task)
			
			-- Устанавливаем таймаут
			redis.call('SETEX', processing_key, timeout, task)
			
			return redis.call('LLEN', queue_key)
		`

		result, err := rdb.Eval(ctx, script,
			[]string{"test:queue", "test:processing"},
			`{"id":"123"}`, "60",
		).Result()

		if err != nil {
			fmt.Printf("❌ Multiple args Lua error: %v\n", err)
			t.Logf("This is EXACTLY the error asynq gives!")
			t.Fail()
		} else {
			require.Equal(t, int64(1), result)
			fmt.Println("✅ Multiple args Lua script OK")
		}
	})
}

func TestAsynqDirect(t *testing.T) {
	ctx := context.Background()

	// Очищаем Redis
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	rdb.FlushAll(ctx)

	redisOpt := asynq.RedisClientOpt{
		Addr: "localhost:6379",
		DB:   0,
	}

	// 1. Проверка создания клиента
	t.Run("create_client", func(t *testing.T) {
		client := asynq.NewClient(redisOpt)
		require.NotNil(t, client)
		defer client.Close()
		fmt.Println("✅ Client created")
	})

	// 2. Проверка отправки простой задачи
	t.Run("send_simple_task", func(t *testing.T) {
		client := asynq.NewClient(redisOpt)
		defer client.Close()

		task := asynq.NewTask("test:simple", []byte(`{"test":"data"}`))

		info, err := client.Enqueue(task)
		if err != nil {
			fmt.Printf("❌ Enqueue error: %v\n", err)
			t.Logf("Error type: %T", err)
			t.Fail()
		} else {
			fmt.Printf("✅ Task enqueued: %s\n", info.ID)
		}
	})

	// 3. Проверка отправки с разными опциями
	t.Run("send_with_options", func(t *testing.T) {
		client := asynq.NewClient(redisOpt)
		defer client.Close()

		task := asynq.NewTask("test:options", []byte(`{"test":"data"}`))

		info, err := client.Enqueue(task,
			asynq.Queue("default"),
			asynq.MaxRetry(3),
			asynq.Timeout(10*time.Second),
		)

		if err != nil {
			fmt.Printf("❌ Enqueue with options error: %v\n", err)
			t.Fail()
		} else {
			fmt.Printf("✅ Task with options enqueued: %s\n", info.ID)
		}
	})
}
