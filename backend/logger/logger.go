package logger

import (
	"log/slog"
	"os"
)

var Logger *slog.Logger

func init() {
	opts := &slog.HandlerOptions{
		AddSource: true,
	}

	var handler slog.Handler = slog.NewTextHandler(os.Stdout, opts)

	Logger = slog.New(handler)
}
func Info(message string) {
	Logger.Info(message)
}
func Error(message string) {
	Logger.Error(message)
}
func Debug(message string) {
	Logger.Debug(message)
}
