import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Loader2, Plus, Minus, Move } from 'lucide-react';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  /** When true, map is non-interactive (detail/view mode) */
  readOnly?: boolean;
}

// ─── Inner: Map move event handler ───────────────────────────────────────
const MapMoveHandler: React.FC<{
  onMoveStart: () => void;
  onMoveEnd: (lat: number, lng: number) => void;
}> = ({ onMoveStart, onMoveEnd }) => {
  const map = useMapEvents({
    movestart() {
      onMoveStart();
    },
    moveend() {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
};

// ─── Inner: Fly to target coordinate ─────────────────────────────────────
const FlyToLocation: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 16, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// ─── Inner: Sync map center on external changes (manual lat/lng input) ──
const SyncMapCenter: React.FC<{ center: [number, number]; enabled: boolean }> = ({ center, enabled }) => {
  const map = useMap();
  const prevCenter = useRef(center);
  useEffect(() => {
    if (!enabled) return;
    if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
      prevCenter.current = center;
      map.panTo(center, { animate: true, duration: 0.4 });
    }
  }, [center, map, enabled]);
  return null;
};

// ─── Inner: Custom zoom controls ─────────────────────────────────────────
const CustomZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute right-3 bottom-20 flex flex-col gap-1.5 pointer-events-auto" style={{ zIndex: 1000 }}>
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-md border border-white/40 shadow-lg text-on-surface hover:bg-white hover:scale-105 transition-all cursor-pointer"
        title="Zoom in"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-md border border-white/40 shadow-lg text-on-surface hover:bg-white hover:scale-105 transition-all cursor-pointer"
        title="Zoom out"
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
    </div>
  );
};

// Default center: Purwakarta, Jawa Barat, Indonesia
const DEFAULT_CENTER: [number, number] = [-6.5562, 107.4467];

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude: rawLatitude,
  longitude: rawLongitude,
  onChange,
  height = '360px',
  readOnly = false,
}) => {
  const latitude = rawLatitude != null ? parseFloat(String(rawLatitude)) : null;
  const longitude = rawLongitude != null ? parseFloat(String(rawLongitude)) : null;
  const hasValidCoords =
    latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);

  const center: [number, number] = hasValidCoords ? [latitude, longitude] : DEFAULT_CENTER;

  // UI states
  const [isDragging, setIsDragging] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const suppressMoveEnd = useRef(false);

  // ─── Reverse geocoding ───────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      );
      const data = await res.json();
      setAddress(data?.display_name || null);
    } catch {
      setAddress(null);
    }
    setIsReverseGeocoding(false);
  }, []);

  // Initial reverse geocode
  const initialGeocodeDone = useRef(false);
  useEffect(() => {
    if (hasValidCoords && !initialGeocodeDone.current) {
      initialGeocodeDone.current = true;
      reverseGeocode(latitude!, longitude!);
    }
  }, [hasValidCoords, latitude, longitude, reverseGeocode]);

  // ─── Map move handlers ───────────────────────────────────────────
  const handleMoveStart = useCallback(() => {
    if (readOnly) return;
    setIsDragging(true);
  }, [readOnly]);

  const handleMoveEnd = useCallback(
    (lat: number, lng: number) => {
      setIsDragging(false);
      if (readOnly) return;
      if (suppressMoveEnd.current) {
        suppressMoveEnd.current = false;
        return;
      }
      onChange(lat, lng);
      reverseGeocode(lat, lng);
    },
    [onChange, reverseGeocode, readOnly],
  );

  // ─── Search ──────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=id`,
      );
      const data = await res.json();
      if (data?.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        suppressMoveEnd.current = true;
        onChange(lat, lng);
        setFlyTarget([lat, lng]);
        setAddress(data[0].display_name || null);
      }
    } catch {
      // silently fail
    }
    setIsSearching(false);
  };

  // ─── GPS ─────────────────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        suppressMoveEnd.current = true;
        onChange(lat, lng);
        setFlyTarget([lat, lng]);
        reverseGeocode(lat, lng);
      },
      () => {},
      { enableHighAccuracy: true },
    );
  };

  return (
    <div className="space-y-2">
      <label className="block font-label-sm text-[11px] font-bold text-on-surface-variant uppercase flex items-center gap-1.5">
        <MapPin size={13} className="text-primary" />
        Titik Koordinat Lokasi Sampling
      </label>

      {/* ═══════════ MAP CONTAINER ═══════════ */}
      <div
        className="relative rounded-2xl overflow-hidden border border-outline-variant/60"
        style={{
          height,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* ─── Floating Search Bar (inside map, top) ─── */}
        {!readOnly && (
          <div
            className="absolute top-3 left-3 right-3 pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div className="flex gap-1.5 pointer-events-auto">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Cari lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), handleSearch())
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/85 backdrop-blur-xl border border-white/50 text-[11px] text-on-surface outline-none focus:bg-white focus:border-primary/30 transition-all placeholder:text-on-surface-variant/50"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="px-3.5 py-2.5 bg-primary/90 backdrop-blur-md text-on-primary rounded-xl text-[10px] font-bold hover:bg-primary transition-all cursor-pointer disabled:opacity-60"
                style={{ boxShadow: '0 2px 12px rgba(0,106,68,0.25)' }}
              >
                {isSearching ? '...' : 'Cari'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Fixed Center Pin Overlay ─── */}
        {!readOnly && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div className="relative flex flex-col items-center">
              {/* Pulse rings */}
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2">
                <div
                  className="w-6 h-6 rounded-full bg-primary/30 -translate-x-1/2 -translate-y-1/2"
                  style={{ animation: 'pinPulse 2s ease-out infinite' }}
                />
                <div
                  className="absolute top-0 left-0 w-6 h-6 rounded-full bg-primary/20 -translate-x-1/2 -translate-y-1/2"
                  style={{ animation: 'pinPulseInner 2s ease-out infinite 0.3s' }}
                />
              </div>

              {/* Pin SVG */}
              <div
                className={`transition-all duration-300 ease-out ${
                  isDragging ? '-translate-y-5 scale-110' : 'translate-y-0 scale-100'
                }`}
                style={{ filter: isDragging ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }}
              >
                <svg width="44" height="56" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="modernPinGrad" x1="22" y1="2" x2="22" y2="48" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00a85a" />
                      <stop offset="0.5" stopColor="#006a44" />
                      <stop offset="1" stopColor="#004d30" />
                    </linearGradient>
                    <radialGradient id="pinGlow" cx="22" cy="18" r="18" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00c96e" stopOpacity="0.3" />
                      <stop offset="1" stopColor="#006a44" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Outer glow */}
                  <ellipse cx="22" cy="20" rx="16" ry="16" fill="url(#pinGlow)" />
                  {/* Pin body */}
                  <path
                    d="M22 2C12.611 2 5 9.611 5 19c0 11 17 33 17 33s17-22 17-33c0-9.389-7.611-17-17-17z"
                    fill="url(#modernPinGrad)"
                  />
                  {/* White inner circle */}
                  <circle cx="22" cy="19" r="8" fill="white" />
                  {/* Inner green dot */}
                  <circle cx="22" cy="19" r="4" fill="#006a44" />
                  {/* Highlight reflection */}
                  <ellipse cx="17" cy="13" rx="4" ry="3" fill="white" opacity="0.2" />
                </svg>
              </div>

              {/* Ground shadow */}
              <div
                className={`w-4 h-2 rounded-full bg-black/25 transition-all duration-300 ease-out ${
                  isDragging ? 'scale-[2.5] opacity-15 mt-1' : 'scale-100 opacity-35 -mt-1'
                }`}
              />
            </div>
          </div>
        )}

        {/* Read-only pin (smaller, no animation) */}
        {readOnly && hasValidCoords && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div className="flex flex-col items-center" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
              <svg width="32" height="42" viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="roPinGrad" x1="22" y1="2" x2="22" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00a85a" />
                    <stop offset="1" stopColor="#004d30" />
                  </linearGradient>
                </defs>
                <path
                  d="M22 2C12.611 2 5 9.611 5 19c0 11 17 33 17 33s17-22 17-33c0-9.389-7.611-17-17-17z"
                  fill="url(#roPinGrad)"
                />
                <circle cx="22" cy="19" r="8" fill="white" />
                <circle cx="22" cy="19" r="4" fill="#006a44" />
              </svg>
              <div className="w-3 h-1.5 rounded-full bg-black/20 -mt-0.5" />
            </div>
          </div>
        )}

        {/* ─── GPS Button (floating, inside map) ─── */}
        {!readOnly && (
          <div
            className="absolute right-3 top-16 pointer-events-auto"
            style={{ zIndex: 1000 }}
          >
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              title="Gunakan lokasi saat ini"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-md border border-white/40 shadow-lg text-primary hover:bg-white hover:text-primary hover:scale-105 transition-all cursor-pointer"
            >
              <Navigation size={15} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* ─── Address Card (bottom of map) ─── */}
        {!readOnly && (address || isReverseGeocoding) && (
          <div
            className="absolute left-3 right-3 bottom-3 pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div
              className="bg-white/90 backdrop-blur-xl rounded-xl px-3.5 py-2.5 border border-white/50 pointer-events-auto"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            >
              {isReverseGeocoding ? (
                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span className="font-medium">Mencari alamat...</span>
                </div>
              ) : address ? (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-on-surface font-semibold leading-relaxed line-clamp-2">
                      {address}
                    </p>
                    {hasValidCoords && (
                      <p className="text-[9px] text-on-surface-variant/60 font-mono mt-0.5">
                        {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ─── Drag Hint (when no coords selected) ─── */}
        {!readOnly && !hasValidCoords && !isDragging && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ zIndex: 1000 }}
          >
            <div
              className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-3.5 py-2 rounded-full whitespace-nowrap"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
            >
              <Move size={12} />
              Geser peta untuk memilih lokasi
            </div>
          </div>
        )}

        {/* ═══════════ LEAFLET MAP ═══════════ */}
        <MapContainer
          center={center}
          zoom={hasValidCoords ? 16 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!readOnly}
          dragging={!readOnly}
          doubleClickZoom={!readOnly}
          touchZoom={!readOnly}
          zoomControl={false}
          className="z-0 modern-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {!readOnly && (
            <>
              <MapMoveHandler onMoveStart={handleMoveStart} onMoveEnd={handleMoveEnd} />
              <CustomZoomControls />
            </>
          )}
          {flyTarget && <FlyToLocation center={flyTarget} />}
          <SyncMapCenter center={center} enabled={hasValidCoords} />
        </MapContainer>
      </div>

      {/* ─── Manual Coordinate Input (below map, only in edit mode) ─── */}
      {!readOnly && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-on-surface-variant/60 uppercase">
                  Lat
                </span>
                <input
                  type="text"
                  value={hasValidCoords ? latitude!.toFixed(6) : ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onChange(v, longitude || DEFAULT_CENTER[1]);
                  }}
                  placeholder="-6.556200"
                  className="w-full pl-9 pr-2 py-2 rounded-lg border border-outline-variant/50 bg-surface-container-low text-[11px] font-mono text-on-surface outline-none focus:border-primary/50 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-on-surface-variant/60 uppercase">
                  Lng
                </span>
                <input
                  type="text"
                  value={hasValidCoords ? longitude!.toFixed(6) : ''}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v)) onChange(latitude || DEFAULT_CENTER[0], v);
                  }}
                  placeholder="107.446700"
                  className="w-full pl-9 pr-2 py-2 rounded-lg border border-outline-variant/50 bg-surface-container-low text-[11px] font-mono text-on-surface outline-none focus:border-primary/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {!hasValidCoords && (
            <p className="text-[10px] text-on-surface-variant/60 italic flex items-center gap-1">
              <Move size={10} />
              Geser peta atau gunakan pencarian/GPS untuk menandai titik lokasi.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default LocationPicker;
