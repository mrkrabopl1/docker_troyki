package util

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/spf13/viper"
)

// Config stores all configuration of the application.
// The values are read by viper from a config file or environment variable.
type Config struct {
	Environment          string        `mapstructure:"ENVIRONMENT"`
	AllowedOrigins       []string      `mapstructure:"ALLOWED_ORIGINS"`
	DBSource             string        `mapstructure:"DB_SOURCE"`
	MigrationURL         string        `mapstructure:"MIGRATION_URL"`
	RedisAddress         string        `mapstructure:"REDIS_ADDRESS"`
	HTTPServerAddress    string        `mapstructure:"HTTP_SERVER_ADDRESS"`
	AppURL               string        `mapstructure:"APP_URL"`
	GRPCServerAddress    string        `mapstructure:"GRPC_SERVER_ADDRESS"`
	TokenSymmetricKey    string        `mapstructure:"TOKEN_SYMMETRIC_KEY"`
	AccessTokenDuration  time.Duration `mapstructure:"ACCESS_TOKEN_DURATION"`
	RefreshTokenDuration time.Duration `mapstructure:"REFRESH_TOKEN_DURATION"`
	EmailSenderName      string        `mapstructure:"EMAIL_SENDER_NAME"`
	EmailSenderAddress   string        `mapstructure:"EMAIL_SENDER_ADDRESS"`
	EmailSenderPassword  string        `mapstructure:"EMAIL_SENDER_PASSWORD"`
	ImageBasePath        string        `mapstructure:"IMAGE_BASE_PATH"`
	UseCDN               bool          `mapstructure:"USE_CDN"`
	ImageBaseDir         string        `mapstructure:"IMAGE_BASE_DIR"`
	MaxImageSizeMB       int64         `mapstructure:"MAX_IMAGE_SIZE_MB"`
	SMTPAuthAddress      string        `mapstructure:"SMTP_AUTH_ADDRESS"` // smtp.timeweb.ru
	SMTPServerAddress    string        `mapstructure:"SMTP_SERVER_ADDRESS"`
}

func LoadConfig(path string) (config Config, err error) {
	// 1. Устанавливаем имена файла и пути
	viper.SetConfigName("app")
	viper.SetConfigType("env")
	viper.AddConfigPath(path)

	// 2. Включаем автоматическое чтение переменных окружения
	viper.AutomaticEnv()

	// 3. Пытаемся прочитать файл конфигурации
	//    Если файл не найден — это нормально, используем только окружение
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// Файл не найден — игнорируем ошибку
			fmt.Println("Config file not found, using environment variables")
		} else {
			// Другая ошибка (например, синтаксическая) — возвращаем её
			return config, err
		}
	}

	// 4. Явно привязываем ключи конфига к переменным окружения
	//    Это гарантирует, что переменные окружения имеют высший приоритет
	viper.BindEnv("DB_SOURCE")
	viper.BindEnv("REDIS_ADDRESS")
	viper.BindEnv("HTTP_SERVER_ADDRESS")
	viper.BindEnv("GRPC_SERVER_ADDRESS")
	viper.BindEnv("TOKEN_SYMMETRIC_KEY")
	viper.BindEnv("ACCESS_TOKEN_DURATION")
	viper.BindEnv("REFRESH_TOKEN_DURATION")
	viper.BindEnv("EMAIL_SENDER_NAME")
	viper.BindEnv("EMAIL_SENDER_ADDRESS")
	viper.BindEnv("EMAIL_SENDER_PASSWORD")
	viper.BindEnv("ENVIRONMENT")
	viper.BindEnv("ALLOWED_ORIGINS")
	viper.BindEnv("MIGRATION_URL")
	viper.BindEnv("IMAGE_BASE_PATH")
	viper.BindEnv("IMAGE_BASE_DIR")
	viper.BindEnv("USE_CDN")
	viper.BindEnv("APP_URL")
	viper.BindEnv("MAX_IMAGE_SIZE_MB")
	viper.BindEnv("SMTP_SERVER_ADDRESS")
	viper.BindEnv("SMTP_SERVER_ADDRESS")
	// 5. Распаковываем в структуру
	err = viper.Unmarshal(&config)
	return
}

func CreateConfig(dbSource string) *pgxpool.Config {
	const defaultMaxConns = int32(4)
	const defaultMinConns = int32(0)
	const defaultMaxConnLifetime = time.Hour
	const defaultMaxConnIdleTime = time.Minute * 30
	const defaultHealthCheckPeriod = time.Minute
	const defaultConnectTimeout = time.Second * 50

	// Your own Database URL

	// fmt.Println(dbPath, os.Getenv("DATABASE_URL"), "tggtttttttttttttttttttttttttttttttttttttttttttttttttt")
	//store := db.NewPostgresStore(os.Getenv("DATABASE_URL"))
	//var DATABASE_URL string = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", "localhost", "5432", cfg.PgUser, cfg.PgPass, cfg.PgBase)

	fmt.Println(dbSource, "askdas;kd;aslkd;l")
	dbConfig, err := pgxpool.ParseConfig(dbSource)
	if err != nil {
		log.Fatal("Failed to create a config, error: ", err)
	}

	dbConfig.MaxConns = defaultMaxConns
	dbConfig.MinConns = defaultMinConns
	dbConfig.MaxConnLifetime = defaultMaxConnLifetime
	dbConfig.MaxConnIdleTime = defaultMaxConnIdleTime
	dbConfig.HealthCheckPeriod = defaultHealthCheckPeriod
	dbConfig.ConnConfig.ConnectTimeout = defaultConnectTimeout

	dbConfig.BeforeAcquire = func(ctx context.Context, c *pgx.Conn) bool {
		log.Println("Before acquiring the connection pool to the database!!")
		return true
	}

	dbConfig.AfterRelease = func(c *pgx.Conn) bool {
		log.Println("After releasing the connection pool to the database!!")
		return true
	}

	dbConfig.BeforeClose = func(c *pgx.Conn) {
		log.Println("Closed the connection pool to the database!!")
	}

	return dbConfig
}
