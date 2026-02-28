"use client";

import "leaflet/dist/leaflet.css";

import { divIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type Spot = {
  name: string;
  lat: number;
  lng: number;
  note: string;
};

type TravelMapProps = {
  spots: Spot[];
};

export function TravelMap({ spots }: TravelMapProps) {
  const center = spots.length ? ([spots[0].lat, spots[0].lng] as [number, number]) : ([30.5728, 104.0668] as [number, number]);
  const markerIcon = divIcon({
    className: "custom-pin",
    html: '<div style="width:12px;height:12px;border-radius:9999px;background:#39ff88;box-shadow:0 0 10px rgba(57,255,136,.8);border:2px solid #0a0a0f;"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  return (
    <div className="h-[340px] overflow-hidden rounded-lg border border-white/10">
      <MapContainer center={center} className="h-full w-full" zoom={3} scrollWheelZoom>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {spots.map((spot) => (
          <Marker icon={markerIcon} key={spot.name} position={[spot.lat, spot.lng]}>
            <Popup>
              <strong>{spot.name}</strong>
              <div>{spot.note}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
