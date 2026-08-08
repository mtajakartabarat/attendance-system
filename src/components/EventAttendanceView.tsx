'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { AttendanceReport, Event } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { ArrowLeft, Download, Loader2, AlertCircle, CalendarCheck } from 'lucide-react';

export default function EventAttendanceView({ eventId }: { eventId: number }) {
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    Promise.all([
      api.getAttendanceReport(eventId),
      api.getEvents(),
    ]).then(
      ([reportData, eventList]) => {
        if (cancelled) return;
        setReport(reportData);
        setEvent(eventList.find(e => e.id === eventId) ?? null);
      },
      (err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
      }
    );
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const records = report?.records ?? [];

  const handleExport = async () => {
    if (!eventId) return;
    setExporting(true);
    setError(null);
    try {
      const csv = await api.exportAttendance(eventId);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event?.access_code || 'event'}_attendance.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengekspor CSV');
    } finally {
      setExporting(false);
    }
  };

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="text-center text-slate-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p>Acara tidak ditemukan.</p>
          <Link href="/admin" className="inline-block mt-4 text-indigo-400 hover:text-white">Kembali ke Admin</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors border"
              style={{ borderColor: '#2a2a3a' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{event?.name ?? 'Daftar Kehadiran'}</h2>
              <p className="text-sm text-slate-400">
                {event ? `${event.event_month} ${event.event_year}` : 'Memuat...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || !eventId}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: '#10b981' }}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl text-red-400 text-sm bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!report && !error && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}

        {report && (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#2a2a3a' }}>
              <p className="text-sm text-slate-400">{records.length} attendee tercatat</p>
              <span className="text-sm text-emerald-400 font-medium">
                {report.stats.byStatus['hadir']} hadir
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500" style={{ backgroundColor: '#1a1a24' }}>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Gender</th>
                    <th className="px-4 py-3 font-medium">Perwakilan</th>
                    <th className="px-4 py-3 font-medium">Cabang</th>
                    <th className="px-4 py-3 font-medium">Usroh</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Info</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        Belum ada absensi untuk acara ini.
                      </td>
                    </tr>
                  ) : (
                    [...records]
                      .sort((a, b) => a.nama.localeCompare(b.nama))
                      .map((record) => (
                        <tr key={record.id} className="border-t" style={{ borderColor: '#2a2a3a' }}>
                          <td className="px-4 py-3 text-white">{record.nama}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs ${
                              record.gender === 'laki-laki' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                            }`}>
                              {record.gender === 'laki-laki' ? 'L' : 'P'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{record.perwakilan}</td>
                          <td className="px-4 py-3 text-slate-300">{record.cabang}</td>
                          <td className="px-4 py-3 text-slate-300">{record.usroh}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs ${STATUS_COLORS[record.status]}`}>
                              {STATUS_LABELS[record.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{record.info || '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EventAttendanceQueryView() {
  const searchParams = useSearchParams();
  return <EventAttendanceView eventId={Number(searchParams.get('eventId'))} />;
}
