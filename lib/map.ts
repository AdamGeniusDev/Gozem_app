// lib/map.ts
import useLocationStore from "@/store/location.store";
import { Distance } from "@/types/type";

export const CalculateDistance = ({lat, lon}: Distance) => {
    // ✅ Utiliser getState() au lieu du hook
    const coords = useLocationStore.getState().coords;
    
    if(!coords) {
        // Si pas de coords, demander la permission
        useLocationStore.getState().askPermission();
        return null;
    }
    
    // Rayon de la terre en kilomètres
    const R = 6371;

    // Conversion des degrés en radians
    const dLat = (coords.latitude - lat) * Math.PI / 180;
    const dLon = (coords.longitude - lon) * Math.PI / 180;

    // Formule de Haversine
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI/180) * Math.cos(coords.latitude * Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance;
}

export const CalculatePriceFromDistance = ({ distance }: { distance: number }): number => {
  const basicPrice = distance * 150;

  if (basicPrice < 500) return 500;

  const valueConvert = basicPrice % 100;

  if (valueConvert === 0 || valueConvert === 50) {
    return basicPrice;
  }

  if (valueConvert < 50) {
    return basicPrice - valueConvert;
  }

  return basicPrice + (100 - valueConvert);
}

export const CalculateDelaiFromDistance = ({distance}: {distance: number}): string => {
    if (distance <= 3) return '15-20';
    if (distance <= 6) return '25-35';
    if (distance <= 10) return '35-40';
    if (distance <= 13) return '35-40';
    if (distance <= 16) return '40-45';
    if (distance <= 20) return '45-50';
    return 'Hors de portée';
}