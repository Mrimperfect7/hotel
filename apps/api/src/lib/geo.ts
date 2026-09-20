import { haversineMeters } from '@gsv/types';
import { config } from '@gsv/config';

/** Distance to Guruvayoor Temple from coordinates; null when coords missing. */
export function templeDistanceMeters(lat: number, lng: number): number {
  return haversineMeters(lat, lng, config.temple.lat, config.temple.lng);
}
