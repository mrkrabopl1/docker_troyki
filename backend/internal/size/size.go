// internal/size/size.go
package size

import (
	"encoding/json"
	"os"
)

var tables map[string]interface{}

func Load(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &tables)
}

// GetAll возвращает полную таблицу размеров
func GetAll() map[string]interface{} {
	return tables
}
