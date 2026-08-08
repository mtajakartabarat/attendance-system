import { Suspense } from 'react';
import type { Metadata } from 'next';
import { EventAttendanceQueryView } from '@/components/EventAttendanceView';

export const metadata: Metadata = {
  title: 'Attendance - Attendance System',
  description: 'View event attendance',
};

export default function EventAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
          <div className="text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#6366f1' }} />
            <p>Memuat daftar kehadiran...</p>
          </div>
        </div>
      }
    >
      <EventAttendanceQueryView />
    </Suspense>
  );
}
