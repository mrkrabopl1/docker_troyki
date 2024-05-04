package db

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
)

func (s *PostgresStore) CreateTables(ctx context.Context) {
	db, _ := s.connect(ctx)

	defer db.Close()

	// db.Exec(`CREATE TABLE IF NOT EXISTS main_page (
	// 	id serial PRIMARY KEY NOT NULL ,
	// 	imagePath TEXT NOT NULL UNIQUE,
	// 	mainText TEXT NOT NULL UNIQUE,
	// 	subText  TEXT,
	// 	line  TEXT NOT NULL
	// 	)`)

	// db.Exec(`CREATE TABLE IF NOT EXISTS discount (
	// 	id serial PRIMARY KEY NOT NULL ,
	// 	productid INT NOT NULL,
	// 	value JSON NOT NULL,
	// 	minprice INT ,
	// 	maxdiscprice INT
	// 	)`)

	// db.Exec(`INSERT INTO discount
	// 		(productId,value) VALUES (2,'{"11":9000,"10":9000}')`)

	// db.Exec(`INSERT INTO main_page (imagePath, mainText, subText, line)
	// 	VALUES ('images/other/ajWallpaper.jpg', 'AIR JORDAN 1', 'BIGGEST COLLECTION', 'air_jordan_1')`)

	db.Exec(`CREATE TABLE IF NOT EXISTS snickers (
		id serial PRIMARY KEY NOT NULL ,
		name TEXT NOT NULL UNIQUE,
		info JSON NOT NULL,
		firm TEXT NOT NULL,
		line TEXT NOT NULL,
		image_path TEXT NOT NULL,
		minPrice INT NOT NULL,
		maxPrice INT NOT NULL,
		"3.5" INT,
		"4" INT,
		"4.5" INT,
		"5" INT,
		"5.5" INT,
		"6" INT,
		"6.5" INT,
		"7" INT,
		"7.5" INT,
		"8" INT,
		"8.5" INT,
		"9" INT,
		"9.5" INT,
		"10" INT,
		"10.5" INT,
		"11" INT,
		"11.5" INT,
		"12" INT,
		"12.5" INT,
		"13" INT
		)`)

	// if e != nil {
	// 	fmt.Println("fatal Error", e.Error())
	// }

	// s.dbx.Exec(`CREATE TABLE IF NOT EXISTS Customers (
	// 	id serial PRIMARY KEY NOT NULL ,
	// 	name TEXT NOT NULL,
	// 	secondName TEXT,
	// 	mail TEXT NOT NULL,
	// 	phone TEXT NOT NULL,
	// 	country TEXT NOT NULL,
	// 	town TEXT NOT NULL,
	// 	postIndex INT
	// 	)`)

	// s.dbx.Exec(`CREATE TABLE IF NOT EXISTS preorder (
	// 		id serial PRIMARY KEY NOT NULL ,
	// 		hashUrl TEXT NOT NULL,
	// 		updateTime DATE
	// 		)`)

	// s.dbx.Exec(`CREATE TABLE IF NOT EXISTS preorderItems (
	// 			id serial PRIMARY KEY NOT NULL ,
	// 			OrderID INT NOT NULL,
	// 			ProductID INT NOT NULL,
	// 			Quantity INT NOT NULL,
	// 			Size TEXT,
	// 			FOREIGN KEY (OrderID) REFERENCES preorder(id),
	// 			FOREIGN KEY (ProductID) REFERENCES snickers(id)
	// 		)`)

	// if e != nil {
	// 	fmt.Println("fatal Error", e.Error())
	// }

	// done := make(chan bool)
	// var wg sync.WaitGroup
	// wg.Add(1)
	// go func() {
	// 	defer wg.Done()
	// _, err := s.dbx.Exec(`
	// CREATE TYPE status_enum AS ENUM ('pending', 'approved', 'rejected');
	// CREATE TYPE delivery_enum AS ENUM ('own', 'express', 'cdek');
	// CREATE TABLE Orders (
	// 	id serial PRIMARY KEY,
	// 	CustomerID INT  NOT NULL,
	// 	OrderDate DATE  NOT NULL,
	// 	Status status_enum  NOT NULL,
	// 	DeliveryPrice INT  NOT NULL,
	// 	DeliveryType delivery_enum  NOT NULL,
	// 	FOREIGN KEY (CustomerID) REFERENCES Customers(id)

	// );
	// `)

	// if err != nil {
	// 	fmt.Println("Error creating table: ", err)
	// 	//done <- true
	// } else {
	// 	fmt.Println("Table created successfully2")
	// 	//done <- true
	// }
	// }()
	// // if e1 != nil {
	// // 	fmt.Println("fatal Error", e.Error())
	// // }
	// <-done
	// fmt.Println("next step")
	// wg.Add(1)
	// go func() {
	// 	defer wg.Done()
	// 	_, err := s.dbx.Exec(`CREATE TABLE OrderItems (
	// 	OrderItemID serial PRIMARY KEY NOT NULL,
	// 	OrderID INT,
	// 	ProductID INT,
	// 	Quantity INT,
	// 	Size TEXT,
	// 	FOREIGN KEY (OrderID) REFERENCES Orders(id),
	// 	FOREIGN KEY (ProductID) REFERENCES snickers(id)
	// )`)
	// 	if err != nil {
	// 		fmt.Println("Error creating table: ", err)
	// 	} else {
	// 		done <- true
	// 	}
	// 	fmt.Println("Table created successfully1")
	// }()
	// <-done
	// wg.Wait()
}

func (s *PostgresStore) FillTables(ctx context.Context, data []SnickersStruct) {
	db, _ := s.connect(ctx)
	defer db.Close()

	dataM := map[string]string{
		"Size35":  "3.5",
		"Size4":   "4",
		"Size45":  "4.5",
		"Size5":   "5",
		"Size55":  "5.5",
		"Size6":   "6",
		"Size65":  "6.5",
		"Size7":   "7",
		"Size75":  "7.5",
		"Size8":   "8",
		"Size85":  "8.5",
		"Size9":   "9",
		"Size95":  "9.5",
		"Size10":  "10",
		"Size105": "10.5",
		"Size11":  "11",
		"Size115": "11.5",
		"Size12":  "12",
		"Size125": "12.5",
		"Size13":  "13",
	}

	// s.dbx.Exec(`INSERT INTO snickers (name, firm,image_path, info, minPrice, maxPrice  12)
	// VALUES (45436364)`)

	for _, value := range data {
		fmt.Println(value)

		strConcat := ""

		dataConcat := ""

		for key, value1 := range dataM {
			data := reflect.ValueOf(value).FieldByName(key)
			fmt.Println(data)

			if data.Float() != 0 {
				strConcat += "\"" + value1 + "\"" + ","
				stringValue := fmt.Sprintf("%d", int(data.Float()))
				dataConcat += stringValue + ","
			}

		}
		strCon := strConcat[:len(strConcat)-1]
		dataCon := dataConcat[:len(dataConcat)-1]
		fmt.Println(dataConcat)
		jsonData, _ := json.Marshal(value.Info)

		dataStr := fmt.Sprintf(`INSERT INTO snickers (name, firm, line, image_path, info, minPrice, maxPrice, %s)
					VALUES ('%s', '%s', '%s','%s', '%s', %d,%d, %s)`, strCon, value.Name, value.Firm, value.Line, value.Image_path, string(jsonData), int(value.MinPrice), int(value.MaxPrice), dataCon)

		fmt.Println(dataStr)
		db.Exec(dataStr)
	}
}
