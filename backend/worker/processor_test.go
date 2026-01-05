package worker

import (
	"context"
	"fmt"
	"testing"

	"github.com/go-redis/redis/v8"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/stretchr/testify/require"
)

// Setup real Redis connection for testing
func setupTestRedis() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr: "localhost:6379", // Ensure Redis is running
		DB:   1,                // Use a separate DB for testing
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
	result, err := taskProcessor.GetProductsInfo(ctx, string(1))
	fmt.Println(result, err)
	require.NoError(t, err)
	require.NotEmpty(t, result)
}
