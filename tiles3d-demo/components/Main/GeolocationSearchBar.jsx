import React, { useState } from 'react';
import { useAppState } from '../../state';

const GeolocationSearchBar = () => {
  const [address, setAddress] = useState('');
  const { flyToLocation } = useAppState();

  const handleSearch = async () => {
    try {
      // Using Ryan's public Mapbox token for demo purposes
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=pk.eyJ1IjoicnlhbmhsZXdpcyIsImEiOiJjbDhkcWZzcHowbGhiM3VrOWJ3ZmtzcnZyIn0.ipWAZK-oipctMjaHytOUKQ`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        flyToLocation(latitude, longitude);
      } else {
        console.error('No results found');
      }
    } catch (error) {
      console.error('Error during geocoding:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10" style={{ position: "absolute" }}>
      <div className="flex items-center bg-white rounded-full shadow-md w-64 h-10 overflow-hidden">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search locations"
          className="flex-grow px-2 py-2 bg-transparent focus:outline-none text-sm"
        />
      </div>
    </div>
  );
};

export default GeolocationSearchBar;