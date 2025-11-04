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

export const CalculatePriceFromDistance = ({distance}: {distance: number}): number => {
    if (distance <= 3) return 1000;
    if (distance <= 6) return 1500;
    if (distance <= 10) return 2000;
    if (distance <= 13) return 2500;
    return 3000;
}

export const CalculateDelaiFromDistance = ({distance}: {distance: number}): string => {
    if (distance <= 3) return '15-20';
    if (distance <= 6) return '25-35';
    if (distance <= 10) return '35-40';
    if (distance <= 13) return '35-40';
    return 'Hors de portée';
}