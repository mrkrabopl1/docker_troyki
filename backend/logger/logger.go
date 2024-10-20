package logger

import (
	"os"
	"runtime/debug"
	"time"

	"github.com/rs/zerolog"
)

type ZeroLogger struct {
	Log zerolog.Logger
}

func InitLogger() *ZeroLogger {
	buildInfo, _ := debug.ReadBuildInfo()
	// logFile, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	// if err != nil {
	// 	log.Fatal().Err(err).Msg("Failed to open log file")
	// }
	// defer logFile.Close()
	zl := zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}).
		Level(zerolog.TraceLevel).
		With().
		Timestamp().
		Int("pid", os.Getpid()).
		Str("go_version", buildInfo.GoVersion).
		Logger()
	return &ZeroLogger{Log: zl}
}

func (zl *ZeroLogger) Debug(msg string, keysAndValues ...interface{}) {
	zl.Log.Debug().Fields(keysAndValues).Msg(msg)
}

func (zl *ZeroLogger) InfoFields(msg string, keysAndValues ...interface{}) {
	zl.Log.Info().Fields(keysAndValues).Msg(msg)
}

func (zl *ZeroLogger) Warn(msg string, keysAndValues ...interface{}) {
	zl.Log.Warn().Fields(keysAndValues).Msg(msg)
}

func (zl *ZeroLogger) Error(msg string, keysAndValues ...interface{}) {
	zl.Log.Error().Fields(keysAndValues).Msg(msg)
}

func (zl *ZeroLogger) Fatal(msg string, keysAndValues ...interface{}) {
	zl.Log.Fatal().Fields(keysAndValues).Msg(msg)
}

func (zl *ZeroLogger) WithCaller() *zerolog.Logger {
	loger := zl.Log.With().Caller().Logger()
	return &loger
}
