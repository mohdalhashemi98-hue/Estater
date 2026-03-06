import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { api } from '../../api/client';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  address: string;
  propertyName: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '280px',
  borderRadius: '0.75rem 0.75rem 0 0',
};

const defaultCenter = { lat: 25.2048, lng: 55.2708 }; // Dubai

export default function PropertyMap({ address, propertyName }: PropertyMapProps) {
  const [center, setCenter] = useState(defaultCenter);
  const [geocoded, setGeocoded] = useState(false);

  const { data: config } = useQuery<{ google_maps_api_key: string | null }>({
    queryKey: ['config'],
    queryFn: () => api.get('/config'),
  });

  const apiKey = config?.google_maps_api_key;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    id: 'google-map-script',
  });

  useEffect(() => {
    if (!isLoaded || !apiKey || !address) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: `${address}, UAE` }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCenter({ lat: location.lat(), lng: location.lng() });
        setGeocoded(true);
      }
    });
  }, [isLoaded, apiKey, address]);

  if (!apiKey) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-[180px] bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">Map Preview</p>
          <p className="text-xs text-gray-400 mt-0.5">Add GOOGLE_MAPS_API_KEY to .env to enable</p>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100">
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent-600" />
            {address}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-[280px] skeleton rounded-t-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={geocoded ? 16 : 12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {geocoded && (
          <Marker
            position={center}
            title={propertyName}
          />
        )}
      </GoogleMap>
      <div className="px-4 py-2.5 border-t border-gray-100">
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-accent-600" />
          {address}
        </p>
      </div>
    </div>
  );
}
