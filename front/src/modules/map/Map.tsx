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
import Stroke from 'ol/style/Stroke';
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import s from "./style.module.css";

const DEFAULT_CENTER = [37.6173, 55.7558]; // Москва
const DEFAULT_ZOOM = 12;
const MAX_ZOOM = 18;

type MapComponentProps = {
    location?: [number, number];
};

const MapComponent: React.FC<MapComponentProps> = ({ location }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<Map | null>(null);
    const vectorLayerRef = useRef<VectorLayer | null>(null);
    const vectorSourceRef = useRef<VectorSource | null>(null);
    const pointFeatureRef = useRef<Feature | null>(null);

    const pointStyle = useMemo(() => new Style({
        image: new Circle({
            radius: 8,
            fill: new Fill({
                color: 'rgba(255, 82, 82, 0.9)',
            }),
            stroke: new Stroke({
                color: '#ffffff',
                width: 2
            })
        }),
    }), []);

    useEffect(() => {
        if (!mapRef.current) return;

        vectorSourceRef.current = new VectorSource();
        vectorLayerRef.current = new VectorLayer({
            source: vectorSourceRef.current,
        });

        pointFeatureRef.current = new Feature();
        pointFeatureRef.current.setStyle(pointStyle);
        
        const initialGeometry = new Point(fromLonLat(location || DEFAULT_CENTER));
        pointFeatureRef.current.setGeometry(initialGeometry);
        vectorSourceRef.current.addFeature(pointFeatureRef.current);

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
    }, [pointStyle]);

    useEffect(() => {
        if (!location || !pointFeatureRef.current || !mapInstance.current) return;

        const newGeometry = new Point(fromLonLat(location));
        pointFeatureRef.current.setGeometry(newGeometry);
        mapInstance.current.getView().setCenter(fromLonLat(location));
        mapInstance.current.getView().setZoom(DEFAULT_ZOOM);
    }, [location]);

    return (
        <div className={s.mapWrapper}>
            <div ref={mapRef} className={s.mapHolder} />
        </div>
    );
};

export default React.memo(MapComponent);