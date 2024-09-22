package logger

import (
	"os"
	"runtime/debug"
	"time"

	"github.com/rs/zerolog"
)

var Logger zerolog.Logger

func init() {
	buildInfo, _ := debug.ReadBuildInfo()
	Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}).
		Level(zerolog.TraceLevel).
		With().
		Timestamp().
		Caller().
		Int("pid", os.Getpid()).
		Str("go_version", buildInfo.GoVersion).
		Logger()
}

func Debug(msg string, keysAndValues ...interface{}) {
	Logger.Debug().Fields(keysAndValues).Msg(msg)
}

func Info(msg string, keysAndValues ...interface{}) {
	Logger.Info().Fields(keysAndValues).Msg(msg)
}

func Warn(msg string, keysAndValues ...interface{}) {
	Logger.Warn().Fields(keysAndValues).Msg(msg)
}

func Error(msg string, keysAndValues ...interface{}) {
	Logger.Error().Fields(keysAndValues).Msg(msg)
}

func Fatal(msg string, keysAndValues ...interface{}) {
	Logger.Fatal().Fields(keysAndValues).Msg(msg)
}
