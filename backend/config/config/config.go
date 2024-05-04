package config

import (
	"fmt"
	"log"

	"github.com/ilyakaznacheev/cleanenv"
)

type Database struct {
	PgHost string
	PgPort string
	PgUser string
	PgPass string
	PgBase string
}

type HTTPServer struct {
	//IdleTimeout  time.Duration
	Port int `json:"Port" env-default:"localhost8080"`
	//ReadTimeout  time.Duration
	//WriteTimeout time.Duration
}

type Configuration struct {
	HTTPServer
	Database
}

var cfg Configuration

func LoadConfig() *Configuration {
	// err := godotenv.Load("local.cfg")
	// if err != nil {
	// 	log.Fatalln(err)
	// }

	if err := cleanenv.ReadConfig("config.json", &cfg); err != nil {
		log.Fatalln(err)
	}

	// fileName := "local.cfg"
	// file, e := os.Open(fileName)

	// stat, e := file.Stat()

	// arrByte := make([]byte, stat.Size())

	// // arrByte, e := os.ReadFile(fileName)
	// if e != nil {
	// 	fmt.Printf("There is no file %s", fileName)
	// }

	// file.Read(arrByte)

	// json.Unmarshal(arrByte, &cfg)
	fmt.Println(cfg)

	return &cfg

}
