export const getTimeFromDate = (date: string | Date, addMinutes: number = 0): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '00:00';

  if (addMinutes !== 0) {
    dateObj.setMinutes(dateObj.getMinutes() + addMinutes);
  }

  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

export const compareTime = (time1: string, time2: string): number => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);

  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;

  if (minutes1 < minutes2) return -1;
  if (minutes1 > minutes2) return 1;
  return 0;
};

export const isTimeBetween = (
  time: string,
  startTime: string,
  endTime: string
): boolean => {
  return compareTime(time, startTime) >= 0 && compareTime(time, endTime) <= 0;
};


export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

export const isRestaurantOpen = (
    currentTime: string,
    openTime: string,
    closeTime: string
): boolean => {
    const current = timeToMinutes(currentTime);
    const open = timeToMinutes(openTime);
    const close = timeToMinutes(closeTime);

    // Restaurant ferme après minuit (ex: 22:00 - 02:00)
    if (close < open) {
        return current >= open || current <= close;
    }

    // Restaurant ferme le même jour (ex: 08:00 - 22:00)
    return current >= open && current <= close;
};

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const formatDate = (date: string | Date, locale: string = 'fr-FR'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };

  return dateObj.toLocaleDateString(locale, options);
};

export const formatDateRelative = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Comparer uniquement les dates (sans l'heure)
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(dateObj, today)) {
    return "Aujourd'hui";
  }

  if (isSameDay(dateObj, yesterday)) {
    return "Hier";
  }

  return formatDate(dateObj);
};