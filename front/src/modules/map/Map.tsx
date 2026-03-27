import React, { useEffect, useRef, useMemo } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import s from "./style.module.css";

const DEFAULT_CENTER = [37.6173, 55.7558];
const DEFAULT_ZOOM = 14;
const MAX_ZOOM = 18;

type MapComponentProps = {
    location?: [number, number];
    path?: Array<[number, number]>;
};

const MapComponent: React.FC<MapComponentProps> = ({ location, path }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<Map | null>(null);
    const vectorLayerRef = useRef<VectorLayer | null>(null);
    const vectorSourceRef = useRef<VectorSource | null>(null);
    const pointFeatureRef = useRef<Feature | null>(null);
    const routeFeatureRef = useRef<Feature | null>(null);

    // Стиль для фона-капли
    const pointerStyle = useMemo(() => new Style({
        image: new Icon({
            src: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
                    <path fill="#FF5252" stroke="white" stroke-width="2" d="M20 0C9 0 0 9 0 20c0 10 20 30 20 30s20-20 20-30c0-11-9-20-20-20z"/>
                    <circle fill="white" cx="20" cy="18" r="12"/>
                </svg>
            `),
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
        }),
    }), []);

    // Стиль для логотипа
    const logoSVGStyle = useMemo(() => new Style({
        image: new Icon({
            src: '/public/troyki_logo.svg',
            anchor: [0.5, 1.9],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            width: 24,
            height: 24,
        }),
    }), []);

    // Стиль для линии маршрута
    const routeStyle = useMemo(() => new Style({
        stroke: new Stroke({
            color: '#2196F3',
            width: 4,
        }),
    }), []);

    useEffect(() => {
        if (!mapRef.current) return;

        vectorSourceRef.current = new VectorSource();
        vectorLayerRef.current = new VectorLayer({
            source: vectorSourceRef.current,
        });

        // Создаем две фичи для маркера: фон-капля и логотип поверх
        const pointerFeature = new Feature();
        pointerFeature.setStyle(pointerStyle);
        
        const logoFeature = new Feature();
        logoFeature.setStyle(logoSVGStyle);
        
        const initialGeometry = new Point(fromLonLat(location || DEFAULT_CENTER));
        pointerFeature.setGeometry(initialGeometry);
        logoFeature.setGeometry(initialGeometry);
        
        vectorSourceRef.current.addFeature(pointerFeature);
        vectorSourceRef.current.addFeature(logoFeature);
        
        pointFeatureRef.current = logoFeature; // сохраняем ссылку на логотип для обновления

        routeFeatureRef.current = new Feature();
        routeFeatureRef.current.setStyle(routeStyle);
        vectorSourceRef.current.addFeature(routeFeatureRef.current);

        mapInstance.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({ 
                    source: new OSM(),
                    opacity: 0.8
                }),
                vectorLayerRef.current,
            ],
            view: new View({
                center: fromLonLat(location || DEFAULT_CENTER),
                zoom: DEFAULT_ZOOM,
                maxZoom: MAX_ZOOM,
                minZoom: 3,
            }),
            controls: []
        });

        return () => {
            if (mapInstance.current) {
                mapInstance.current.setTarget(undefined);
                mapInstance.current = null;
            }
        };
    }, [pointerStyle, logoSVGStyle, routeStyle]);

    // Обновляем положение всех маркеров
    useEffect(() => {
        if (!location || !pointFeatureRef.current || !mapInstance.current) return;

        const newGeometry = new Point(fromLonLat(location));
        
        // Обновляем геометрию для всех фич в слое
        vectorSourceRef.current?.getFeatures().forEach(feature => {
            if (feature !== routeFeatureRef.current) {
                feature.setGeometry(newGeometry);
            }
        });
        
        mapInstance.current.getView().setCenter(fromLonLat(location));
        mapInstance.current.getView().setZoom(DEFAULT_ZOOM);
    }, [location]);

    // Обновляем маршрут
    useEffect(() => {
        if (!routeFeatureRef.current) return;
        
        if (path && path.length >= 2) {
            const transformedPath = path.map(coord => fromLonLat(coord));
            const lineGeometry = new LineString(transformedPath);
            routeFeatureRef.current.setGeometry(lineGeometry);
        } else {
            routeFeatureRef.current.setGeometry(null);
        }
    }, [path]);

    return (
        <div onWheel={(e)=>{
            e.stopPropagation()
        }} className={s.mapWrapper}>
            <div ref={mapRef} className={s.mapHolder} />
        </div>
    );
};

export default React.memo(MapComponent);