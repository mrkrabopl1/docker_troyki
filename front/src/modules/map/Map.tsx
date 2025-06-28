import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import 'ol/ol.css'; // Подключаем стили OpenLayers
import { fromLonLat } from 'ol/proj';
import { Color } from 'ol/color';
import s from "./style.module.css"
const CENTER = [0, 0];
const ZOOM = 18;
const MAX_ZOOM = 30;

type urlParamsType = {
    location: number[]
};
const MapComponent: React.FC<urlParamsType> = (props) => {
    const {location} = { ...props }
    const mapRef = useRef(null); // Реф для контейнера карты
    const mapModel = useRef(null)
    const vectorLayer = useRef(null)
    const vectorSource = useRef(null)
    const point = useRef(null)

    useEffect(() => {
        // Инициализация карты только после монтирования компонента
        if (!mapRef.current) return;
        vectorSource .current  = new VectorSource()
        vectorLayer.current =  new VectorLayer({
            source: vectorSource .current ,
        })
        point.current = new Feature()
        point.current .setStyle(new Style({
            image: new Circle({
                radius: 6,
                fill: new Fill({
                    color: 'rgba(255, 0, 0, 0.5)',
                }),
            }),
        }))
        const geometry = new Point(fromLonLat(CENTER))
       // const geometry = new Point(fromLonLat([location[0],location[1]]));
        point.current.setGeometry(geometry);
        vectorSource.current.addFeature(point.current)
        point.current.set("type", "line");
        mapModel.current = new Map({
            target: mapRef.current, // Используем DOM-элемент рефа
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
                vectorLayer.current,
            ],
            view: new View({
                center: [...CENTER],
                zoom: ZOOM,
                maxZoom: MAX_ZOOM
            }),
            controls: []
        });

        // Очистка при размонтировании компонента
        return () => mapModel.current.setTarget(undefined);
    }, []);
    useEffect(() => {
        if(!location) return
        const geometry = new Point(fromLonLat([location[0],location[1]]));
        point.current.setGeometry(geometry);
        mapModel.current.getView().setCenter(fromLonLat([location[0],location[1]]));
    }, [location]);

    return (
        <div
            ref={mapRef}
            className={s.mapHolder}
        />
    );
};

export default MapComponent;