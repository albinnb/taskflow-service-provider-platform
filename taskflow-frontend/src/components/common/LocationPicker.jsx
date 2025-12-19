import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { FaLocationArrow } from 'react-icons/fa';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Sub-component: Search Control ---
const SearchField = ({ onLocationFound }) => {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider();

        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            showMarker: false, // We manage our own marker
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
            searchLabel: 'Search for address (e.g. Lulu Mall)',
        });

        map.addControl(searchControl);

        // Event listener for search results
        map.on('geosearch/showlocation', (result) => {
            if (result.location) {
                onLocationFound({
                    lat: result.location.y,
                    lng: result.location.x,
                    label: result.location.label,
                });
            }
        });

        return () => map.removeControl(searchControl);
    }, [map, onLocationFound]);

    return null;
};

// --- Sub-component: Handle Map Clicks ---
const MapEvents = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
};

// --- Sub-component: Recenter Map ---
const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng]);
    }, [lat, lng, map]);
    return null;
};

const LocationPicker = ({ value, onChange }) => {
    // Default to a central location (e.g., Kerala) or use provided value
    const [position, setPosition] = useState(
        value && value.lat && value.lng ? { lat: value.lat, lng: value.lng } : { lat: 9.9312, lng: 76.2673 } // Cochin
    );
    const [address, setAddress] = useState(value?.address || '');

    const markerRef = useRef(null);

    // Sync internal state if prop value changes externally
    useEffect(() => {
        if (value && value.lat && value.lng) {
            setPosition({ lat: value.lat, lng: value.lng });
        }
        if (value && value.address) {
            setAddress(value.address);
        }
    }, [value]);

    // Reverse Geocoding Helper
    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            const fullAddress = data.display_name;
            const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || '';
            const pincode = data.address.postcode || '';
            const street = data.address.road || data.address.suburb || '';
            const houseName = data.address.house_number || ''; // Often missing, but good to check

            setAddress(fullAddress);
            onChange({
                coordinates: { lat, lng },
                fullAddress: fullAddress,
                city: city,
                state: state,
                pincode: pincode,
                street: street,
                houseName: houseName
            });
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            // Fallback: update coords without address
            onChange({
                coordinates: { lat, lng },
                fullAddress: "Address lookup failed",
                city: ""
            });
        }
    };

    // Handler: Marker Drag
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    setPosition({ lat, lng });
                    fetchAddress(lat, lng);
                }
            },
        }),
        []
    );

    // Handler: Search Result
    const handleSearchResult = (location) => {
        setPosition({ lat: location.lat, lng: location.lng });
        // The search result comes with a label, but let's standardize via reverse geocoding or use label directly
        setAddress(location.label);

        // Extract city naively or re-fetch details
        // For simplicity, we trigger onChange with the search label
        onChange({
            coordinates: { lat: location.lat, lng: location.lng },
            fullAddress: location.label,
            city: '' // Search result doesn't explicitly give city easily, relies on backend or reverse geocode if strictly needed
        });
    };

    // Handler: Map Click
    const handleMapClick = (latlng) => {
        setPosition(latlng);
        fetchAddress(latlng.lat, latlng.lng);
    };

    // Handler: Locate Me
    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition({ lat: latitude, lng: longitude });
                    fetchAddress(latitude, longitude);
                },
                (err) => {
                    console.error(err);
                    alert("Location access denied or unavailable.");
                }
            );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1 mx-2">
                    {address ? `📍 ${address}` : "Search or tap on map"}
                </p>
                <button
                    type="button"
                    onClick={handleLocateMe}
                    className="flex items-center px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded hover:bg-teal-700 transition"
                >
                    <FaLocationArrow className="mr-1" /> My Location
                </button>
            </div>

            <div className="border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm h-[400px] relative z-0">
                <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <SearchField onLocationFound={handleSearchResult} />
                    <MapEvents onMapClick={handleMapClick} />
                    <RecenterAutomatically lat={position.lat} lng={position.lng} />

                    <Marker
                        draggable={true}
                        eventHandlers={eventHandlers}
                        position={position}
                        ref={markerRef}
                    >
                    </Marker>
                </MapContainer>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                * You can drag the marker or click on the map to pinpoint your location.
            </p>
        </div>
    );
};

export default LocationPicker;
