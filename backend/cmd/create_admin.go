// cmd/create_admin.go
package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	db "github.com/mrkrabopl1/go_db/db/sqlc"
	"github.com/mrkrabopl1/go_db/util"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {

	DB_SOURCE := "postgresql://postgres:s8121996@172.30.48.1:5432/troyki?sslmode=disable"
	connPool, err := pgxpool.NewWithConfig(context.Background(), util.CreateConfig(DB_SOURCE))
	if err != nil {
		log.Fatal("cannot connect to db:", err)
	}
	defer connPool.Close()

	store := db.NewStore(connPool, nil)
	ctx := context.Background()

	reader := bufio.NewReader(os.Stdin)

	// Сначала удаляем старого админа если есть
	fmt.Print("Email to delete (leave empty to skip): ")
	emailToDelete, _ := reader.ReadString('\n')
	emailToDelete = strings.TrimSpace(emailToDelete)

	if emailToDelete != "" {
		err = store.DeleteAdminByEmail(ctx, emailToDelete)
		if err != nil {
			fmt.Printf("Error deleting admin: %v\n", err)
		} else {
			fmt.Println("✅ Old admin deleted")
		}
	}

	// Создаем нового
	fmt.Print("Email: ")
	email, _ := reader.ReadString('\n')
	email = strings.TrimSpace(email)

	fmt.Print("Name: ")
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)

	fmt.Print("Password: ")
	bytePassword, _ := term.ReadPassword(int(syscall.Stdin))
	password := string(bytePassword)
	fmt.Println()

	fmt.Print("Confirm password: ")
	bytePassword2, _ := term.ReadPassword(int(syscall.Stdin))
	password2 := string(bytePassword2)
	fmt.Println()

	if password != password2 {
		fmt.Println("Passwords do not match")
		os.Exit(1)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error hashing password:", err)
		os.Exit(1)
	}

	_, err = store.CreateAdmin(ctx, db.CreateAdminParams{
		Email:        email,
		Name:         name,
		PasswordHash: hashedPassword,
		Role:         db.AdminRoleEnumSuperadmin,
		IsActive:     pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		fmt.Println("Error creating admin:", err)
		os.Exit(1)
	}

	fmt.Println("✅ Admin created successfully!")
}
