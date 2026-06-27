'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Attendee, AttendanceReport, AttendanceStatus, AttendanceStats, Event } from '@/types';
import { api } from '@/lib/api';

interface AttendanceContextType {
  events: Event[];
  attendees: Attendee[];
  attendanceRecords: Record<string, AttendanceStatus>;
  loading: boolean;
  error: string | null;
  getEventByCode: (code: string) => Promise<Event | null>;
  searchAttendees: (query: string) => Promise<Attendee[]>;
  checkAttendance: (attendeeId: number, eventId: number) => Promise<{ exists: boolean; status: AttendanceStatus | null }>;
  recordAttendance: (attendeeId: number, eventId: number, status: AttendanceStatus) => Promise<void>;
  getAttendanceStats: (eventId: number) => Promise<AttendanceStats>;
  getAttendanceReport: (eventId: number) => Promise<AttendanceReport>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getEvents().then(setEvents),
      api.getAttendees().then(setAttendees),
    ]).then(() => setLoading(false)).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const getEventByCode = useCallback(async (code: string): Promise<Event | null> => {
    return api.getEventByCode(code);
  }, []);

  const searchAttendees = useCallback(async (query: string): Promise<Attendee[]> => {
    if (!query.trim()) return attendees;
    return api.searchAttendees(query);
  }, [attendees]);

  const checkAttendance = useCallback(async (attendeeId: number, eventId: number) => {
    return api.checkAttendance(attendeeId, eventId);
  }, []);

  const recordAttendance = useCallback(async (attendeeId: number, eventId: number, status: AttendanceStatus) => {
    await api.recordAttendance(attendeeId, eventId, status);
    const key = `${eventId}-${attendeeId}`;
    setAttendanceRecords(prev => ({ ...prev, [key]: status }));
  }, []);

  const getAttendanceStats = useCallback(async (eventId: number): Promise<AttendanceStats> => {
    const report = await api.getAttendanceReport(eventId);
    return report.stats;
  }, []);

  const getAttendanceReport = useCallback(async (eventId: number): Promise<AttendanceReport> => {
    return api.getAttendanceReport(eventId);
  }, []);

  return (
    <AttendanceContext.Provider value={{
      events,
      attendees,
      attendanceRecords,
      loading,
      error,
      getEventByCode,
      searchAttendees,
      checkAttendance,
      recordAttendance,
      getAttendanceStats,
      getAttendanceReport,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
}
