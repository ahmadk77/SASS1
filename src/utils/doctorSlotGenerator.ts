export interface DoctorSchedule {
  dayOfWeek: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "17:00"
  slotDurationMinutes: number; // e.g. 30
  isAvailable?: boolean;
}

export interface ExistingAppointment {
  date: string;
  time?: string;
  confirmedTime?: string;
  status?: string;
  doctorId?: string | number;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 540; // 09:00 AM default
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const parts = clean.replace(/(AM|PM)/g, '').trim().split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function formatMinutesTo12H(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr} ${period}`;
}

export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return 'Sunday';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()] || 'Sunday';
  }
  const d = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getDay()] || 'Sunday';
}

export function generateAvailableSlots(
  chosenDate: string,
  schedule: DoctorSchedule | null,
  existingAppointments: ExistingAppointment[]
): { slots: { timeLabel: string; isBooked: boolean }[]; availableSlots: string[] } {
  if (schedule && schedule.isAvailable === false) {
    return { slots: [], availableSlots: [] };
  }

  const startTimeStr = schedule?.startTime || "09:00";
  const endTimeStr = schedule?.endTime || "17:00";
  const duration = schedule?.slotDurationMinutes || 30;

  const startMins = parseTimeToMinutes(startTimeStr);
  const endMins = parseTimeToMinutes(endTimeStr);

  const rawSlots: { label: string; start: number; end: number }[] = [];
  let curr = startMins;

  while (curr + duration <= endMins) {
    const next = curr + duration;
    const label = `${formatMinutesTo12H(curr)} - ${formatMinutesTo12H(next)}`;
    rawSlots.push({ label, start: curr, end: next });
    curr = next;
  }

  const activeAppsForDate = existingAppointments.filter(app => {
    if (app.status === 'cancelled' || app.status === 'deleted') return false;
    return app.date === chosenDate;
  });

  const slots = rawSlots.map(slot => {
    const isBooked = activeAppsForDate.some(app => {
      const appTime = (app.confirmedTime || app.time || '').trim().toUpperCase();
      if (!appTime) return false;
      return appTime === slot.label.toUpperCase() || 
             appTime.includes(slot.label.toUpperCase()) || 
             slot.label.toUpperCase().includes(appTime);
    });
    return {
      timeLabel: slot.label,
      isBooked
    };
  });

  const availableSlots = slots.filter(s => !s.isBooked).map(s => s.timeLabel);

  return { slots, availableSlots };
}
