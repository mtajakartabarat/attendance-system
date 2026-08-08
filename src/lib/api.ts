import type { Attendee, AttendanceReport, AttendanceStatus, Event } from '@/types';

const REGION = 'asia-southeast2';
const PROJECT = 'attendance-system-380dd';
const BASE = `https://${REGION}-${PROJECT}.cloudfunctions.net`;

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function callFunction<T>(name: string, data?: Record<string, unknown>): Promise<T> {
  const url = `${BASE}/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: data ?? {} }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const body = await res.json();
  if (body.error) throw new Error(body.error.message ?? 'Unknown error');
  return (body.result as ApiResponse<T>).data;
}

export const api = {
  getEvents: () => callFunction<Event[]>('getEvents'),
  getEventByCode: (accessCode: string) => callFunction<Event | null>('getEventByCode', { accessCode }),
  getAttendees: () => callFunction<Attendee[]>('getAttendees'),
  searchAttendees: (query: string) => callFunction<Attendee[]>('searchAttendees', { query }),
  checkAttendance: (attendeeId: number, eventId: number) =>
    callFunction<{ exists: boolean; status: AttendanceStatus | null }>('checkAttendance', { attendeeId, eventId }),
  recordAttendance: (attendeeId: number, eventId: number, status: AttendanceStatus, info?: string) =>
    callFunction<{ record: { id: number }; updated: boolean }>('recordAttendance', { attendeeId, eventId, status, info: info ?? '' }),
  getAttendanceReport: (eventId: number) => callFunction<AttendanceReport>('getAttendanceReport', { eventId }),
  exportAttendance: (eventId: number) => callFunction<string>('exportAttendance', { eventId }),
  createEvent: (data: { name: string; event_month: string; event_year: string; access_code: string; access_code_expiration: string }) =>
    callFunction<Event>('createEvent', data),
  updateEvent: (data: { id: number; name: string; event_month: string; event_year: string; access_code: string; access_code_expiration: string }) =>
    callFunction<Event>('updateEvent', data),
  deleteEvent: (id: number) => callFunction<{ success: boolean }>('deleteEvent', { id }),
};
