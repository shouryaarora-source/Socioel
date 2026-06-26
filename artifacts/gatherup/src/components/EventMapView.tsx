import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { format } from "date-fns";
import { Calendar, Clock, Users } from "lucide-react";
import { Link } from "wouter";
import { Event } from "@workspace/api-client-react";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORY_COLORS: Record<string, string> = {
  running: "#f97316",
  hiking: "#22c55e",
  cycling: "#3b82f6",
  sports: "#a855f7",
  yoga: "#ec4899",
  social: "#14b8a6",
  fitness: "#f59e0b",
};

function createPinIcon(category: string) {
  const color = CATEGORY_COLORS[category.toLowerCase()] ?? "#6366f1";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <ellipse cx="16" cy="40" rx="8" ry="2" fill="rgba(0,0,0,0.2)"/>
      <path d="M16 2C9.373 2 4 7.373 4 14c0 9.333 12 26 12 26S28 23.333 28 14C28 7.373 22.627 2 16 2z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="16" cy="14" r="5" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  const prevCenter = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (
      center &&
      (!prevCenter.current ||
        prevCenter.current[0] !== center[0] ||
        prevCenter.current[1] !== center[1])
    ) {
      map.setView(center, 13, { animate: true });
      prevCenter.current = center;
    }
  }, [center, map]);
  return null;
}

interface EventMapViewProps {
  events: Event[];
  userCoords: { lat: number; lng: number } | null;
}

export function EventMapView({ events, userCoords }: EventMapViewProps) {
  const eventsWithCoords = events.filter(
    (e) => e.latitude != null && e.longitude != null
  );

  const defaultCenter: [number, number] =
    userCoords
      ? [userCoords.lat, userCoords.lng]
      : eventsWithCoords.length > 0
      ? [eventsWithCoords[0].latitude!, eventsWithCoords[0].longitude!]
      : [20.5937, 78.9629];

  const userIcon = L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 0 0 3px rgba(99,102,241,0.35)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="rounded-3xl overflow-hidden border border-border/50 shadow-md" style={{ height: "520px" }}>
      <MapContainer
        center={defaultCenter}
        zoom={userCoords ? 13 : 11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <RecenterMap center={userCoords ? [userCoords.lat, userCoords.lng] : null} />

        {userCoords && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <span className="text-sm font-semibold text-foreground">Your location</span>
            </Popup>
          </Marker>
        )}

        {eventsWithCoords.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude!, event.longitude!]}
            icon={createPinIcon(event.category)}
          >
            <Popup minWidth={220} maxWidth={260}>
              <div className="p-1">
                <p className="font-bold text-base leading-snug mb-1" style={{ fontFamily: "inherit" }}>
                  {event.title}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(event.date), "MMM d")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.attendeeCount}/{event.maxAttendees}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{event.location}</p>
                <Link href={`/events/${event.id}`}>
                  <button
                    className="w-full text-center text-xs font-semibold py-1.5 px-3 rounded-full text-white"
                    style={{ background: CATEGORY_COLORS[event.category.toLowerCase()] ?? "#6366f1" }}
                  >
                    View Event →
                  </button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
