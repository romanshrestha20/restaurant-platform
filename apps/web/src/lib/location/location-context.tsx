'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type LocationState = {
  city: string;
  region: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
};

const LOCATION_STORAGE_KEY = 'tablefolk_user_location';

const DEFAULT_LOCATION: LocationState = {
  city: 'Vihti',
  region: 'Uusimaa',
  fullAddress: 'Vihti, Uusimaa',
  latitude: 60.4167,
  longitude: 24.3167,
};

const POPULAR_LOCATIONS: LocationState[] = [
  { city: 'Vihti', region: 'Uusimaa', fullAddress: 'Vihti, Uusimaa', latitude: 60.4167, longitude: 24.3167 },
  { city: 'Helsinki', region: 'Uusimaa', fullAddress: 'Helsinki, Uusimaa', latitude: 60.1699, longitude: 24.9384 },
  { city: 'Espoo', region: 'Uusimaa', fullAddress: 'Espoo, Uusimaa', latitude: 60.2055, longitude: 24.6559 },
  { city: 'Tampere', region: 'Pirkanmaa', fullAddress: 'Tampere, Pirkanmaa', latitude: 61.4978, longitude: 23.7610 },
];

type LocationContextType = {
  currentLocation: LocationState;
  setLocation: (loc: LocationState) => void;
  popularLocations: LocationState[];
  useCurrentGpsLocation: () => Promise<void>;
  isGpsLoading: boolean;
  gpsError: string | null;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationState>(DEFAULT_LOCATION);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const isValidLocation = (value: unknown): value is LocationState => {
    if (!value || typeof value !== 'object') return false;
    const location = value as Partial<LocationState>;
    const { latitude, longitude } = location;
    return (
      typeof location.city === 'string' &&
      typeof location.region === 'string' &&
      typeof location.fullAddress === 'string' &&
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (isValidLocation(parsed)) setCurrentLocation(parsed);
      else localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const setLocation = (loc: LocationState) => {
    if (!isValidLocation(loc)) return;
    setCurrentLocation(loc);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
  };

  const useCurrentGpsLocation = async () => {
    setGpsError(null);
    if (!window.isSecureContext) {
      setGpsError('Location access requires a secure connection.');
      return;
    }
    if (!navigator.geolocation) {
      setGpsError('Location is not supported by this browser.');
      return;
    }
    setIsGpsLoading(true);
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: LocationState = {
            city: 'Near You',
            region: 'Current GPS',
            fullAddress: 'Your Current Location',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setLocation(loc);
          setIsGpsLoading(false);
          resolve();
        },
        (error) => {
          const message = error.code === error.PERMISSION_DENIED
            ? 'Location access was denied. You can choose a city instead.'
            : error.code === error.TIMEOUT
              ? 'Location took too long to resolve. Please try again.'
              : 'We could not determine your location. Please try again.';
          setGpsError(message);
          setIsGpsLoading(false);
          resolve();
        },
        { timeout: 8000, maximumAge: 60000 },
      );
    });
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setLocation,
        popularLocations: POPULAR_LOCATIONS,
        useCurrentGpsLocation,
        isGpsLoading,
        gpsError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    return {
      currentLocation: DEFAULT_LOCATION,
      setLocation: () => {},
      popularLocations: POPULAR_LOCATIONS,
      useCurrentGpsLocation: async () => {},
      isGpsLoading: false,
      gpsError: null,
    };
  }
  return ctx;
}
