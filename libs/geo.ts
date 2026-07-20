/**
 * Geolokatsiya yordamchi funksiyalari.
 * Butun ilova bo'ylab (Homepage, Salons, Salon Detail) qayta ishlatiladi.
 */

const SEOUL_LAT = 37.5665;
const SEOUL_LNG = 126.978;

/** Foydalanuvchining saqlangan (yoki standart Seoul) koordinatalarini olish */
export const getUserCoords = (): { lat: number; lng: number } => {
    if (typeof window === 'undefined') return { lat: SEOUL_LAT, lng: SEOUL_LNG };
    const lat = parseFloat(localStorage.getItem('userLat') ?? '');
    const lng = parseFloat(localStorage.getItem('userLng') ?? '');
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    return { lat: SEOUL_LAT, lng: SEOUL_LNG };
};

/** Foydalanuvchi GPS ruxsati bergan-bermaganini tekshirish */
export const hasUserLocation = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('userLat') !== null;
};

/** GPS ruxsatini so'rash — muvaffaqiyat/xato holatida callback chaqiradi */
export const requestUserLocation = (onDone: () => void): void => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
        localStorage.setItem('userLat', String(SEOUL_LAT));
        localStorage.setItem('userLng', String(SEOUL_LNG));
        onDone();
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            localStorage.setItem('userLat', String(pos.coords.latitude));
            localStorage.setItem('userLng', String(pos.coords.longitude));
            onDone();
        },
        () => {
            localStorage.setItem('userLat', String(SEOUL_LAT));
            localStorage.setItem('userLng', String(SEOUL_LNG));
            onDone();
        },
        { timeout: 8000 },
    );
};

/** Haversine formulasi — ikki koordinata orasidagi masofa (km) */
export const calcDistanceKm = (lat1: number, lng1: number, lat2?: number, lng2?: number): number | null => {
    if (lat2 === undefined || lng2 === undefined || lat2 === null || lng2 === null) return null;
    const R = 6371; // Yer radiusi (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/** Masofani "0.4 km" yoki "1.2 km" formatida matnga o'tkazish */
export const formatDistance = (km: number | null): string => {
    if (km === null) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
};