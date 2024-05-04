package db

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"reflect"
	"strings"
)

type SnickersStruct struct {
	Name       string
	Firm       string
	Line       string
	Image_path string
	Info       map[string]float64
	Size35     float64
	Size4      float64
	Size45     float64
	Size5      float64
	Size55     float64
	Size6      float64
	Size65     float64
	Size7      float64
	Size75     float64
	Size8      float64
	Size85     float64
	Size9      float64
	Size95     float64
	Size10     float64
	Size105    float64
	Size11     float64
	Size115    float64
	Size12     float64
	Size125    float64
	Size13     float64
	MaxPrice   float64
	MinPrice   float64
}

var plug []SnickersStruct

func JSONTransformToStruct() []SnickersStruct {
	dataM := map[string]string{
		"3.5":  "Size35",
		"4":    "Size4",
		"4.5":  "Size45",
		"5":    "Size5",
		"5.5":  "Size55",
		"6":    "Size6",
		"6.5":  "Size65",
		"7":    "Size7",
		"7.5":  "Size75",
		"8":    "Size8",
		"8.5":  "Size85",
		"9":    "Size9",
		"9.5":  "Size95",
		"10":   "Size10",
		"10.5": "Size105",
		"11":   "Size11",
		"11.5": "Size115",
		"12":   "Size12",
		"12.5": "Size125",
		"13":   "Size13",
	}
	temproryMap := make(map[string][]interface{})

	fileName := "db/allPaths.json"
	arrByte, e := os.ReadFile(fileName)

	if e != nil {
		fmt.Println(e.Error())
	}

	json.Unmarshal(arrByte, &temproryMap)

	for key, value := range temproryMap {
		var sinckersElem SnickersStruct
		data := strings.Split(key, "-")

		sinckersElem.Firm = data[0]

		sinckersElem.Line = data[1]

		maxPrice := 0.0
		minPrice := math.MaxFloat64

		for index, value1 := range value {
			if index == 0 {
				sinckersElem.Image_path = fmt.Sprintf("%v", value1)
			}
			if index == 1 {
				sinckersElem.Name = strings.Replace(fmt.Sprintf("%v", value1), "'", "''", -1)
			}
			if index == 2 {
				iter := reflect.ValueOf(value1).MapRange()
				allInfo := make(map[string]float64)
				fmt.Println()
				for iter.Next() {
					//var SnickersInfoCr SnickersInfoCr

					key := fmt.Sprintf("%v", iter.Key().Interface())

					value := iter.Value().Interface()
					fmt.Println(reflect.TypeOf(value))
					switch v := value.(type) {
					case float64:
						vv, ok := dataM[key]

						if ok {
							fieldValue := reflect.ValueOf(&sinckersElem).Elem().FieldByName(vv)
							newVal := reflect.ValueOf(v)
							fieldValue.Set(newVal)
						}

						if v > maxPrice {
							maxPrice = v
						}
						if v < minPrice {
							minPrice = v
						}

						// if priceD, ok := price.(float64); ok {
						// 	snickers.Price = uint32(priceD)
						// }
						fmt.Println(vv, ok, v)
						allInfo[key] = v
					}

					fmt.Println(allInfo)

				}
				sinckersElem.MaxPrice = maxPrice
				sinckersElem.MinPrice = minPrice
				sinckersElem.Info = allInfo
				fmt.Println(sinckersElem)
			}

		}
		plug = append(plug, sinckersElem)

	}
	return plug
}
