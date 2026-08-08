import type { Metadata } from 'next';
import EventAttendanceView from '@/components/EventAttendanceView';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Attendance - Attendance System',
  description: 'View event attendance',
};

export async function generateStaticParams() {
  try {
    const events = await api.getEvents();
    return events.map((event) => ({ eventId: String(event.id) }));
  } catch {
    return [];
  }
}

export default async function EventAttendancePage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventAttendanceView eventId={Number(eventId)} />;
}
