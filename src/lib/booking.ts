import { bookingConfig, getService, timezone, type Service } from "./config";

export type Appointment = {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  whatsapp: string;
  createdAt: string;
};

export type AvailabilityResult = {
  date: string;
  serviceId: string;
  availableTimes: string[];
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: timezone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function todayInSaoPaulo() {
  return dateFormatter.format(new Date());
}

export function nowTimeInSaoPaulo() {
  return timeFormatter.format(new Date());
}

export function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isDateBeforeToday(date: string) {
  return date < todayInSaoPaulo();
}

export function getLocalWeekDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function isOpenDate(date: string) {
  return bookingConfig.openWeekDays.includes(getLocalWeekDay(date));
}

export function appointmentsConflict(
  appointment: Pick<Appointment, "date" | "time" | "serviceId">,
  service: Service,
  date: string,
  time: string,
  existingService: Service,
) {
  if (appointment.date !== date) return false;

  const nextStart = minutesFromTime(time);
  const nextEnd = nextStart + service.durationMinutes;
  const existingStart = minutesFromTime(appointment.time);
  const existingEnd = existingStart + existingService.durationMinutes;

  return nextStart < existingEnd && existingStart < nextEnd;
}

export function getAvailableTimes(
  service: Service,
  date: string,
  appointments: Appointment[],
): AvailabilityResult {
  if (isDateBeforeToday(date) || !isOpenDate(date)) {
    return { date, serviceId: service.id, availableTimes: [] };
  }

  const today = todayInSaoPaulo();
  const now = nowTimeInSaoPaulo();
  const currentMinutes = date === today ? minutesFromTime(now) : -1;
  const end = minutesFromTime(bookingConfig.endTime);
  const availableTimes: string[] = [];

  for (const offeredTime of bookingConfig.offeredTimes) {
    const cursor = minutesFromTime(offeredTime);
    if (cursor < minutesFromTime(bookingConfig.startTime)) continue;
    if (cursor + service.durationMinutes > end) continue;
    if (cursor <= currentMinutes) continue;

    const time = offeredTime;
    const hasConflict = appointments.some((appointment) => {
      const existingService = getService(appointment.serviceId);
      if (!existingService) return true;
      return appointmentsConflict(appointment, service, date, time, existingService);
    });

    if (!hasConflict) availableTimes.push(time);
  }

  return { date, serviceId: service.id, availableTimes };
}

export function canBook(
  service: Service,
  date: string,
  time: string,
  appointments: Appointment[],
) {
  return getAvailableTimes(service, date, appointments).availableTimes.includes(time);
}
