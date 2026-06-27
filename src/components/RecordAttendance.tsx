'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { Search, User, MapPin, Building2, Check, AlertCircle, X, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { AttendanceStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import type { Attendee } from '@/types';

export default function RecordAttendance() {
  const { getEventByCode, searchAttendees, checkAttendance, recordAttendance, attendanceRecords, events, attendees } = useAttendance();
  const [accessCode, setAccessCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPerwakilan, setFilterPerwakilan] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>('hadir');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<{ id: number; name: string; event_month: string; event_year: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Attendee[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState<{ exists: boolean; status: AttendanceStatus | null } | null>(null);
  const [checkingRecord, setCheckingRecord] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = searchQuery.trim();
    if (q.length === 0) {
      setSearchResults(null);
      return;
    }
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchAttendees(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchAttendees]);

  useEffect(() => {
    setDisplayCount(20);
  }, [searchResults, filterPerwakilan, filterCabang]);

  const allAttendees = attendees;

  const displayAttendees = useMemo(() => {
    const source = searchResults ?? allAttendees;
    let results = source;
    if (filterPerwakilan) {
      results = results.filter(a => a.perwakilan === filterPerwakilan);
    }
    if (filterCabang) {
      results = results.filter(a => a.cabang === filterCabang);
    }
    return results;
  }, [searchResults, allAttendees, filterPerwakilan, filterCabang]);

  const visibleAttendees = useMemo(() => displayAttendees.slice(0, displayCount), [displayAttendees, displayCount]);
  const hasMore = displayCount < displayAttendees.length;

  const uniquePerwakilan = useMemo(() => {
    const source = searchResults ?? allAttendees;
    const values = new Set(source.map(a => a.perwakilan));
    return Array.from(values).sort();
  }, [searchResults, allAttendees]);

  const uniqueCabang = useMemo(() => {
    let source = searchResults ?? allAttendees;
    if (filterPerwakilan) {
      source = source.filter(a => a.perwakilan === filterPerwakilan);
    }
    const values = new Set(source.map(a => a.cabang));
    return Array.from(values).sort();
  }, [searchResults, allAttendees, filterPerwakilan]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const found = await getEventByCode(accessCode);
      if (!found) {
        setError('Kode akses tidak valid');
        setCurrentEvent(null);
      } else {
        setCurrentEvent(found);
      }
    } catch (err) {
      setError('Gagal memvalidasi kode akses');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAttendee = async (attendeeId: number) => {
    setSelectedAttendee(attendeeId);
    setSelectedStatus('hadir');
    setExistingRecord(null);
    setShowConfirm(true);

    if (!currentEvent) return;
    setCheckingRecord(true);
    try {
      const result = await checkAttendance(attendeeId, currentEvent.id);
      setExistingRecord(result);
      if (result.exists && result.status) {
        setSelectedStatus(result.status);
      }
    } catch {
      setExistingRecord({ exists: false, status: null });
    } finally {
      setCheckingRecord(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAttendee || !currentEvent) return;
    try {
      await recordAttendance(selectedAttendee, currentEvent.id, selectedStatus);
      setShowConfirm(false);
      setSelectedAttendee(null);
      setSearchQuery('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setError('Gagal mencatat absensi');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterPerwakilan('');
    setFilterCabang('');
  };

  const selectedAttendeeData = displayAttendees.find(a => a.id === selectedAttendee);

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl flex items-center gap-2 animate-fade-in"
             style={{ backgroundColor: '#10b981', color: 'white' }}>
          <Check className="w-5 h-5" />
          <span className="font-medium">Absensi berhasil dicatat!</span>
        </div>
      )}

      {!currentEvent ? (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Masukkan Kode Akses</h2>
            <p className="text-slate-400">Masukkan kode akses acara untuk mencatat absensi</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Contoh: KAJIAN2026"
                className="w-full h-14 pl-12 pr-4 rounded-2xl text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl text-lg font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)' }}
            >
              {loading ? 'Memvalidasi...' : 'Lanjutkan'}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
            <p className="text-sm text-slate-400 mb-2">Kode akses yang tersedia:</p>
            <div className="space-y-1 text-sm text-slate-300">
              {events.map(e => (
                <p key={e.id}><span className="font-mono text-indigo-400">{e.access_code}</span> - {e.name}</p>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{currentEvent.name}</h2>
              <p className="text-sm text-slate-400">{currentEvent.event_month} {currentEvent.event_year}</p>
            </div>
            <button
              onClick={() => { setCurrentEvent(null); setAccessCode(''); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Ubah Kode
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama..."
                className="w-full h-12 pl-12 pr-12 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
              />
              {searchLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 animate-spin" />
              )}
            </div>
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <p className="text-xs text-slate-500 px-1">Ketik minimal 3 karakter untuk mencari</p>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white transition-colors"
              style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
            >
              <span className="text-sm text-slate-400">Filter: {filterPerwakilan || filterCabang ? 'Aktif' : 'Semua'}</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
                <select
                  value={filterPerwakilan}
                  onChange={(e) => setFilterPerwakilan(e.target.value)}
                  className="h-12 px-4 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Semua Perwakilan</option>
                  {uniquePerwakilan.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={filterCabang}
                  onChange={(e) => setFilterCabang(e.target.value)}
                  className="h-12 px-4 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Semua Cabang</option>
                  {uniqueCabang.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {(filterPerwakilan || filterCabang) && (
                  <button
                    onClick={handleResetFilters}
                    className="h-12 px-4 rounded-xl text-sm text-slate-400 hover:text-white transition-colors border sm:col-span-2"
                    style={{ borderColor: '#2a2a3a' }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleAttendees.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 3
                  ? 'Ketik minimal 3 karakter untuk mencari'
                  : 'Tidak ada hasil'}
              </div>
            ) : (
              visibleAttendees.map((attendee) => {
                const key = `${currentEvent.id}-${attendee.id}`;
                const currentStatus = attendanceRecords[key];

                return (
                  <button
                    key={attendee.id}
                    onClick={() => handleSelectAttendee(attendee.id)}
                    className="text-left p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{attendee.nama}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {attendee.perwakilan}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {attendee.cabang}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          attendee.gender === 'laki-laki' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                        }`}>
                          {attendee.gender === 'laki-laki' ? 'L' : 'P'}
                        </span>
                        {currentStatus && (
                          <span className={`px-2 py-1 rounded-lg text-xs ${STATUS_COLORS[currentStatus]}`}>
                            {STATUS_LABELS[currentStatus]}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {hasMore && (
            <button
              onClick={() => setDisplayCount(prev => prev + 20)}
              className="w-full h-12 rounded-xl font-medium text-indigo-400 border border-indigo-500/30 transition-all hover:bg-indigo-500/10 active:scale-[0.98]"
            >
              Load More ({displayAttendees.length - displayCount} remaining)
            </button>
          )}
        </div>
      )}

      {showConfirm && selectedAttendeeData && currentEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 animate-scale-in" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
            <button
              onClick={() => setShowConfirm(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Konfirmasi Absensi</h3>

            {checkingRecord && (
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memeriksa data sebelumnya...
              </div>
            )}

            {!checkingRecord && existingRecord?.exists && (
              <div className="p-3 rounded-xl mb-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>
                  Sudah tercatat sebagai <strong>{existingRecord.status ? STATUS_LABELS[existingRecord.status] : '-'}</strong>.
                  Pilih status baru untuk memperbarui.
                </span>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">Nama</p>
                  <p className="text-white font-medium">{selectedAttendeeData.nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">Perwakilan</p>
                  <p className="text-white font-medium">{selectedAttendeeData.perwakilan}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-400">Cabang</p>
                  <p className="text-white font-medium">{selectedAttendeeData.cabang}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-slate-400">Status Kehadiran</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedStatus === status
                        ? STATUS_COLORS[status]
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-12 rounded-xl font-medium text-slate-300 border transition-colors hover:bg-white/5"
                style={{ borderColor: '#2a2a3a' }}
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={checkingRecord}
                className="flex-1 h-12 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#6366f1' }}
              >
                {existingRecord?.exists ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
