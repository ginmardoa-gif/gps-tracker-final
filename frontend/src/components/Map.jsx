import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const vehicleColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

function MapClickHandler({ onMapClick, pinMode }) {
  useMapEvents({
    click: (e) => {
      if (pinMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

function Map({ vehicles, selectedVehicle, vehicleHistory, savedLocations, placesOfInterest, onRefreshPOI, currentUserRole }) {
  const [center, setCenter] = useState([5.8520, -55.2038]);
  const [pinMode, setPinMode] = useState(false);
  const [tempPin, setTempPin] = useState(null);

  useEffect(() => {
    if (selectedVehicle && vehicleHistory.length > 0) {
      const lastLocation = vehicleHistory[vehicleHistory.length - 1];
      setCenter([lastLocation.latitude, lastLocation.longitude]);
    }
  }, [selectedVehicle, vehicleHistory]);

  const handleMapClick = (latlng) => {
    setTempPin(latlng);
    const name = prompt('Enter name for this location:');
    if (name) {
      savePlace(name, latlng);
    }
    setTempPin(null);
  };

  const savePlace = async (name, latlng) => {
    try {
      const response = await fetch('/api/places-of-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name,
          latitude: latlng.lat,
          longitude: latlng.lng,
          category: 'General',
          address: '',
          description: 'Added from map'
        })
      });
      
      if (response.ok) {
        alert('Location saved successfully!');
        setPinMode(false);
        if (onRefreshPOI) {
          onRefreshPOI();
        }
      } else {
        alert('Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location');
    }
  };

  const createColoredIcon = (color) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const createSavedLocationIcon = () => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #fbbf24; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const createPOIIcon = () => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ec4899; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onMapClick={handleMapClick} pinMode={pinMode} />
        
        {!selectedVehicle && vehicles.map((vehicle, idx) => {
          if (!vehicle.lastLocation) return null;
          const color = vehicleColors[idx % vehicleColors.length];
          
          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.lastLocation.latitude, vehicle.lastLocation.longitude]}
              icon={createColoredIcon(color)}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{vehicle.name}</strong><br />
                  Speed: {vehicle.lastLocation.speed.toFixed(1)} km/h<br />
                  Time: {new Date(vehicle.lastLocation.timestamp).toLocaleString()}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {selectedVehicle && vehicleHistory.length > 0 && (
          <>
            <Polyline
              positions={vehicleHistory.map(loc => [loc.latitude, loc.longitude])}
              color={vehicleColors[(selectedVehicle.id - 1) % vehicleColors.length]}
              weight={3}
              opacity={0.7}
            />
            
            {vehicleHistory.map((loc, idx) => (
              <CircleMarker
                key={idx}
                center={[loc.latitude, loc.longitude]}
                radius={3}
                fillColor={vehicleColors[(selectedVehicle.id - 1) % vehicleColors.length]}
                fillOpacity={0.6}
                stroke={false}
              >
                <Popup>
                  <div className="text-xs">
                    Speed: {loc.speed.toFixed(1)} km/h<br />
                    {new Date(loc.timestamp).toLocaleString()}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            
            <Marker
              position={[vehicleHistory[vehicleHistory.length - 1].latitude, vehicleHistory[vehicleHistory.length - 1].longitude]}
              icon={createColoredIcon(vehicleColors[(selectedVehicle.id - 1) % vehicleColors.length])}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{selectedVehicle.name}</strong><br />
                  Current Position
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {savedLocations.map(loc => (
          <Marker
            key={`saved-${loc.id}`}
            position={[loc.latitude, loc.longitude]}
            icon={createSavedLocationIcon()}
          >
            <Popup>
              <div className="text-sm">
                <strong>📍 {loc.name}</strong><br />
                {loc.visit_type === 'auto_detected' && (
                  <>Stop Duration: {loc.stop_duration_minutes} min<br /></>
                )}
                Time: {new Date(loc.timestamp).toLocaleString()}<br />
                {loc.notes && <><em>{loc.notes}</em><br /></>}
              </div>
            </Popup>
          </Marker>
        ))}

        {placesOfInterest && placesOfInterest.map(place => (
          <Marker
            key={`poi-${place.id}`}
            position={[place.latitude, place.longitude]}
            icon={createPOIIcon()}
          >
            <Popup>
              <div className="text-sm">
                <strong>📍 {place.name}</strong><br />
                {place.category && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{place.category}</span>
                )}<br />
                {place.address && <><em>{place.address}</em><br /></>}
                {place.description && <>{place.description}<br /></>}
              </div>
            </Popup>
          </Marker>
        ))}

        {tempPin && (
          <Marker position={[tempPin.lat, tempPin.lng]} icon={createPOIIcon()} />
        )}
      </MapContainer>

      {['admin', 'manager', 'operator'].includes(currentUserRole) && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={() => setPinMode(!pinMode)}
            className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all ${
              pinMode
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {pinMode ? '📍 Click Map to Pin' : '📍 Pin Location'}
          </button>
          {pinMode && (
            <div className="mt-2 bg-white rounded-lg shadow-lg p-3 text-sm">
              <p className="text-gray-700">Click anywhere on the map to save a location</p>
              <button
                onClick={() => setPinMode(false)}
                className="mt-2 w-full px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Map;
