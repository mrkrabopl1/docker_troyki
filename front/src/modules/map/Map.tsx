import React, { useEffect, useRef, useMemo } from 'react';
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
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import s from "./style.module.css";

const DEFAULT_CENTER = [0, 0];
const DEFAULT_ZOOM = 18;
const MAX_ZOOM = 30;

type MapComponentProps = {
    location?: [number, number];
};

const MapComponent: React.FC<MapComponentProps> = ({ location }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<Map | null>(null);
    const vectorLayerRef = useRef<VectorLayer | null>(null);
    const vectorSourceRef = useRef<VectorSource | null>(null);
    const pointFeatureRef = useRef<Feature | null>(null);

    // Создаем стиль точки один раз
    const pointStyle = useMemo(() => new Style({
        image: new Circle({
            radius: 6,
            fill: new Fill({
                color: 'rgba(255, 0, 0, 0.5)',
            }),
        }),
    }), []);

    // Инициализация карты
    useEffect(() => {
        if (!mapRef.current) return;

        // Создаем источник и слой для векторных данных
        vectorSourceRef.current = new VectorSource();
        vectorLayerRef.current = new VectorLayer({
            source: vectorSourceRef.current,
        });

        // Создаем точку
        pointFeatureRef.current = new Feature();
        pointFeatureRef.current.setStyle(pointStyle);
        
        // Устанавливаем геометрию точки
        const initialGeometry = new Point(fromLonLat(location || DEFAULT_CENTER));
        pointFeatureRef.current.setGeometry(initialGeometry);
        pointFeatureRef.current.set("type", "point");
        
        // Добавляем точку в источник
        vectorSourceRef.current.addFeature(pointFeatureRef.current);

        // Создаем карту
        mapInstance.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ source: new OSM() }),
                vectorLayerRef.current,
            ],
            view: new View({
                center: fromLonLat(location || DEFAULT_CENTER),
                zoom: DEFAULT_ZOOM,
                maxZoom: MAX_ZOOM,
            }),
            controls: []
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.setTarget(undefined);
                mapInstance.current = null;
            }
        };
    }, [pointStyle]);

    // Обновление позиции при изменении location
    useEffect(() => {
        if (!location || !pointFeatureRef.current || !mapInstance.current) return;

        const newGeometry = new Point(fromLonLat(location));
        pointFeatureRef.current.setGeometry(newGeometry);
        mapInstance.current.getView().setCenter(fromLonLat(location));
    }, [location]);

    return <div ref={mapRef} className={s.mapHolder} />;
};

export default React.memo(MapComponent);