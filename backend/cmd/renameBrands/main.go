package main

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/gosimple/slug"
	_ "github.com/lib/pq"
)

func main() {
	dbHost := "postgres_db"
	dbPort := "5432"
	dbUser := "postgres"
	dbPassword := "s8121996"
	dbName := "troyki"
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPassword, dbName)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Ошибка подключения:", err)
	}
	defer db.Close()
	if err := db.Ping(); err != nil {
		log.Fatal("Ошибка пинга БД:", err)
	}
	fmt.Println("Подключено к БД успешно!")
	rows, err := db.Query("SELECT id, name, slug FROM brands")
	if err != nil {
		log.Fatal("Ошибка запроса:", err)
	}
	defer rows.Close()
	type Brand struct {
		ID   int
		Name string
		Slug string
	}
	var brands []Brand
	for rows.Next() {
		var b Brand
		rows.Scan(&b.ID, &b.Name, &b.Slug)
		brands = append(brands, b)
	}
	fmt.Printf("Найдено %d брендов\n", len(brands))
	count := 0
	for _, b := range brands {
		newSlug := slug.Make(b.Name)
		if newSlug == "" || newSlug == b.Slug {
			continue
		}
		_, err := db.Exec("UPDATE brands SET slug = $1 WHERE id = $2", newSlug, b.ID)
		if err != nil {
			log.Printf("Ошибка ID %d: %v", b.ID, err)
		} else {
			fmt.Printf("Обновлен: %s -> %s\n", b.Slug, newSlug)
			count++
		}
	}
	fmt.Printf("Готово! Обновлено %d slug'ов\n", count)
}
