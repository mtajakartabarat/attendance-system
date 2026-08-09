'use client';

import React, { useState, useMemo } from 'react';
import { Search, Users, User, UserX, AlertCircle, TrendingUp, Calendar, Badge, Building2, MapPin, ArrowLeft, ChevronDown, Clock } from 'lucide-react';
import { AttendanceStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { useAttendance } from '@/context/AttendanceContext';
import type { AttendanceReport, AttendanceRecord } from '@/types';

interface DashboardListItem {
  id: number;
  nama: string;
  perwakilan: string;
  cabang: string;
  usroh: string;
  gender: string;
  info: string;
}

function filterDashboardList<T extends Pick<DashboardListItem, 'nama' | 'perwakilan' | 'cabang' | 'usroh'>>(
  items: T[],
  search: string,
  perwakilan: string,
  cabang: string,
  usroh: string
): T[] {
  let results = items;
  if (search.trim()) {
    const q = search.toLowerCase();
    results = results.filter((i) =>
      i.nama.toLowerCase().includes(q) ||
      i.perwakilan.toLowerCase().includes(q) ||
      i.cabang.toLowerCase().includes(q) ||
      i.usroh.toLowerCase().includes(q)
    );
  }
  if (perwakilan) results = results.filter((i) => i.perwakilan === perwakilan);
  if (cabang) results = results.filter((i) => i.cabang === cabang);
  if (usroh) results = results.filter((i) => i.usroh === usroh);
  return results;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function aggregateStats(records: AttendanceRecord[]) {
  const stats = {
    total: records.length,
    byGender: { 'laki-laki': 0, 'perempuan': 0 } as Record<string, number>,
    hadirByGender: { 'laki-laki': 0, 'perempuan': 0 } as Record<string, number>,
    byStatus: {
      hadir: 0, izin: 0, sakit: 0, kerja: 0, pulang_kampung: 0, tanpa_keterangan: 0, meninggal: 0,
    } as Record<AttendanceStatus, number>,
  };

  for (const r of records) {
    stats.byStatus[r.status]++;
    stats.byGender[r.gender]++;
    if (r.status === 'hadir') {
      stats.hadirByGender[r.gender]++;
    }
  }

  return stats;
}

type ViewMode = 'dashboard' | 'status-list';

export default function Dashboard() {
  const { getEventByCode, getAttendanceReport, attendees } = useAttendance();
  const [accessCode, setAccessCode] = useState('');
  const [filterPerwakilan, setFilterPerwakilan] = useState('');
  const [filterCabang, setFilterCabang] = useState('');
  const [filterUsroh, setFilterUsroh] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<{ id: number; name: string; event_month: string; event_year: string } | null>(null);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);
  const [viewingNotPresensi, setViewingNotPresensi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');
  const [statusFilterPerwakilan, setStatusFilterPerwakilan] = useState('');
  const [statusFilterCabang, setStatusFilterCabang] = useState('');
  const [statusFilterUsroh, setStatusFilterUsroh] = useState('');

  const allRecords = report?.records ?? [];

  const uniquePerwakilan = useMemo(() => {
    const values = new Set(allRecords.map(r => r.perwakilan));
    return Array.from(values).sort();
  }, [allRecords]);

  const uniqueCabang = useMemo(() => {
    let filtered = allRecords;
    if (filterPerwakilan) {
      filtered = filtered.filter(r => r.perwakilan === filterPerwakilan);
    }
    const values = new Set(filtered.map(r => r.cabang));
    return Array.from(values).sort();
  }, [allRecords, filterPerwakilan]);

  const uniqueUsroh = useMemo(() => {
    let filtered = allRecords;
    if (filterPerwakilan) {
      filtered = filtered.filter(r => r.perwakilan === filterPerwakilan);
    }
    if (filterCabang) {
      filtered = filtered.filter(r => r.cabang === filterCabang);
    }
    const values = new Set(filtered.map(r => r.usroh));
    return Array.from(values).sort();
  }, [allRecords, filterPerwakilan, filterCabang]);

  const filteredRecords = useMemo(() => {
    let filtered = allRecords;
    if (filterPerwakilan) {
      filtered = filtered.filter(r => r.perwakilan === filterPerwakilan);
    }
    if (filterCabang) {
      filtered = filtered.filter(r => r.cabang === filterCabang);
    }
    if (filterUsroh) {
      filtered = filtered.filter(r => r.usroh === filterUsroh);
    }
    return filtered;
  }, [allRecords, filterPerwakilan, filterCabang, filterUsroh]);

  const stats = useMemo(() => aggregateStats(filteredRecords), [filteredRecords]);

  const recordsByStatus = useMemo(() => {
    if (!selectedStatus) return [];
    return filteredRecords
      .filter(r => r.status === selectedStatus)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [filteredRecords, selectedStatus]);

  const notRecordedAttendees = useMemo(() => {
    const recordedIds = new Set(allRecords.map(r => r.attendee_id));
    let filtered = attendees;
    if (filterPerwakilan) {
      filtered = filtered.filter(a => a.perwakilan === filterPerwakilan);
    }
    if (filterCabang) {
      filtered = filtered.filter(a => a.cabang === filterCabang);
    }
    if (filterUsroh) {
      filtered = filtered.filter(a => a.usroh === filterUsroh);
    }
    return filtered
      .filter(a => !recordedIds.has(a.id))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [attendees, allRecords, filterPerwakilan, filterCabang, filterUsroh]);

  const baseListItems = useMemo<DashboardListItem[]>(
    () => {
      const base = viewingNotPresensi ? notRecordedAttendees : recordsByStatus;
      return base.map((i) => ({
        id: i.id,
        nama: i.nama,
        perwakilan: i.perwakilan,
        cabang: i.cabang,
        usroh: i.usroh,
        gender: i.gender,
        info: 'info' in i ? (i.info ?? '') : '',
      }));
    },
    [viewingNotPresensi, notRecordedAttendees, recordsByStatus]
  );

  const listItems = useMemo(
    () => filterDashboardList(baseListItems, statusSearch, statusFilterPerwakilan, statusFilterCabang, statusFilterUsroh),
    [baseListItems, statusSearch, statusFilterPerwakilan, statusFilterCabang, statusFilterUsroh]
  );

  const listUniquePerwakilan = useMemo(
    () => uniqueSorted(baseListItems.map(i => i.perwakilan)),
    [baseListItems]
  );

  const listUniqueCabang = useMemo(() => {
    let filtered = baseListItems;
    if (statusFilterPerwakilan) {
      filtered = filtered.filter(i => i.perwakilan === statusFilterPerwakilan);
    }
    return uniqueSorted(filtered.map(i => i.cabang));
  }, [baseListItems, statusFilterPerwakilan]);

  const listUniqueUsroh = useMemo(() => {
    let filtered = baseListItems;
    if (statusFilterPerwakilan) {
      filtered = filtered.filter(i => i.perwakilan === statusFilterPerwakilan);
    }
    if (statusFilterCabang) {
      filtered = filtered.filter(i => i.cabang === statusFilterCabang);
    }
    return uniqueSorted(filtered.map(i => i.usroh));
  }, [baseListItems, statusFilterPerwakilan, statusFilterCabang]);

  const totalAttendees = report?.stats.totalAttendees ?? 0;
  const attendancePercentage = totalAttendees > 0 ? Math.round(stats.byStatus['hadir'] / totalAttendees * 100) : 0;

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const found = await getEventByCode(accessCode);
      if (!found) {
        setError('Kode akses tidak valid');
        setCurrentEvent(null);
        return;
      }
      setError(null);
      setCurrentEvent(found);
      const reportData = await getAttendanceReport(found.id);
      setReport(reportData);
    } catch {
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterPerwakilan('');
    setFilterCabang('');
    setFilterUsroh('');
  };

  const handleStatusClick = (status: AttendanceStatus) => {
    setViewingNotPresensi(false);
    setSelectedStatus(status);
    setViewMode('status-list');
    setStatusSearch('');
    setStatusFilterPerwakilan('');
    setStatusFilterCabang('');
    setStatusFilterUsroh('');
  };

  const handleNotPresensiClick = () => {
    setViewingNotPresensi(true);
    setSelectedStatus(null);
    setViewMode('status-list');
    setStatusSearch('');
    setStatusFilterPerwakilan('');
    setStatusFilterCabang('');
    setStatusFilterUsroh('');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedStatus(null);
    setViewingNotPresensi(false);
    setStatusSearch('');
    setStatusFilterPerwakilan('');
    setStatusFilterCabang('');
    setStatusFilterUsroh('');
  };

  const statusIcons: Record<AttendanceStatus, React.ElementType> = {
    hadir: Users,
    izin: Calendar,
    sakit: AlertCircle,
    kerja: TrendingUp,
    pulang_kampung: Badge,
    tanpa_keterangan: AlertCircle,
    meninggal: UserX,
  };

  return (
    <div className="space-y-6">
      {!currentEvent ? (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Dashboard Kehadiran</h2>
            <p className="text-slate-400">Masukkan kode akses untuk melihat dashboard</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Contoh: KAJIAN2026"
                className="w-full h-14 pl-12 pr-4 rounded-2xl text-lg text-white placeholder-slate-500 focus:outline-none"
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
              {loading ? 'Memuat...' : 'Lihat Dashboard'}
            </button>
          </form>
        </div>
      ) : viewMode === 'status-list' && (selectedStatus || viewingNotPresensi) ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <button
              onClick={() => { setCurrentEvent(null); setAccessCode(''); setReport(null); setViewingNotPresensi(false); setStatusSearch(''); setStatusFilterPerwakilan(''); setStatusFilterCabang(''); setStatusFilterUsroh(''); }}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Ubah Kode
            </button>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
            {viewingNotPresensi ? (
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
            ) : (
              <div className={`p-2 rounded-xl ${STATUS_COLORS[selectedStatus!].split(' ')[0]}`}>
                {React.createElement(statusIcons[selectedStatus!], { className: `w-5 h-5 ${STATUS_COLORS[selectedStatus!].split(' ')[1]}` })}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{viewingNotPresensi ? 'Belum Presensi' : STATUS_LABELS[selectedStatus!]}</h2>
              <p className="text-sm text-slate-400">{listItems.length} / {baseListItems.length} attendees</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={statusSearch}
                onChange={(e) => setStatusSearch(e.target.value)}
                placeholder="Cari nama, perwakilan, cabang, atau usroh..."
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilterPerwakilan}
                onChange={(e) => { setStatusFilterPerwakilan(e.target.value); setStatusFilterCabang(''); setStatusFilterUsroh(''); }}
                className="flex-1 h-10 px-3 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
              >
                <option value="">Semua Perwakilan</option>
                {listUniquePerwakilan.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={statusFilterCabang}
                onChange={(e) => { setStatusFilterCabang(e.target.value); setStatusFilterUsroh(''); }}
                className="flex-1 h-10 px-3 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
              >
                <option value="">Semua Cabang</option>
                {listUniqueCabang.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={statusFilterUsroh}
                onChange={(e) => setStatusFilterUsroh(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
              >
                <option value="">Semua Usroh</option>
                {listUniqueUsroh.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {listItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {baseListItems.length === 0
                  ? (viewingNotPresensi ? 'Semua peserta sudah presensi' : 'Tidak ada attendee dengan status ini')
                  : 'Tidak ada hasil filter'}
              </div>
            ) : (
              listItems.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl transition-all"
                  style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white">{record.nama}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {record.perwakilan}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {record.cabang}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {record.usroh}
                      </p>
                      {selectedStatus === 'izin' && record.info && (
                        <p className="text-sm text-amber-400/90 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          {record.info}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs ${
                      record.gender === 'laki-laki' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                    }`}>
                      {record.gender === 'laki-laki' ? 'L' : 'P'}
                    </span>
                  </div>
                </div>
              ))
            )}
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
              onClick={() => { setCurrentEvent(null); setAccessCode(''); setReport(null); setViewingNotPresensi(false); setStatusSearch(''); setStatusFilterPerwakilan(''); setStatusFilterCabang(''); setStatusFilterUsroh(''); }}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Ubah Kode
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white transition-colors"
            style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
          >
            <span className="text-sm text-slate-400">Filter: {filterPerwakilan || filterCabang || filterUsroh ? 'Aktif' : 'Semua'}</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Perwakilan</label>
                <select
                  value={filterPerwakilan}
                  onChange={(e) => { setFilterPerwakilan(e.target.value); setFilterCabang(''); setFilterUsroh(''); }}
                  className="w-full h-12 px-4 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Semua Perwakilan</option>
                  {uniquePerwakilan.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Cabang</label>
                <select
                  value={filterCabang}
                  onChange={(e) => { setFilterCabang(e.target.value); setFilterUsroh(''); }}
                  className="w-full h-12 px-4 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Semua Cabang</option>
                  {uniqueCabang.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Usroh</label>
                <select
                  value={filterUsroh}
                  onChange={(e) => setFilterUsroh(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl text-white text-sm focus:outline-none"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                >
                  <option value="">Semua Usroh</option>
                  {uniqueUsroh.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full h-12 px-4 rounded-xl text-sm text-slate-400 hover:text-white transition-colors border sm:col-span-2 lg:col-span-1"
                  style={{ borderColor: '#2a2a3a' }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {(filterPerwakilan || filterCabang || filterUsroh) && (
            <div className="p-4 rounded-xl flex flex-wrap gap-2" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
              {filterPerwakilan && (
                <span className="px-3 py-1 rounded-lg text-sm flex items-center gap-1 bg-indigo-500/20 text-indigo-400">
                  <Building2 className="w-3 h-3" />
                  {filterPerwakilan}
                </span>
              )}
              {filterCabang && (
                <span className="px-3 py-1 rounded-lg text-sm flex items-center gap-1 bg-indigo-500/20 text-indigo-400">
                  <MapPin className="w-3 h-3" />
                  {filterCabang}
                </span>
              )}
              {filterUsroh && (
                <span className="px-3 py-1 rounded-lg text-sm flex items-center gap-1 bg-indigo-500/20 text-indigo-400">
                  <Users className="w-3 h-3" />
                  {filterUsroh}
                </span>
              )}
              <span className="text-sm text-slate-400 self-center">
                {filteredRecords.length} attendee{filteredRecords.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-400">Total Hadir</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.byStatus['hadir']}</p>
            </div>

            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">Laki-laki</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.hadirByGender['laki-laki']}</p>
            </div>

            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}>
                  <User className="w-5 h-5 text-pink-400" />
                </div>
                <span className="text-sm text-slate-400">Perempuan</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.hadirByGender['perempuan']}</p>
            </div>

            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-400">% Kehadiran</span>
              </div>
              <p className="text-3xl font-bold text-white">{attendancePercentage}%</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Kehadiran per Status</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => {
                const Icon = statusIcons[status];
                const count = stats.byStatus[status];
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusClick(status)}
                    disabled={count === 0}
                    className={`p-4 rounded-2xl transition-all hover:scale-[1.02] ${count === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={{ 
                      backgroundColor: '#12121a', 
                      border: '1px solid #2a2a3a'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${STATUS_COLORS[status].split(' ')[0]}`}>
                        <Icon className={`w-5 h-5 ${STATUS_COLORS[status].split(' ')[1]}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-slate-400">{STATUS_LABELS[status]}</p>
                        <p className="text-2xl font-bold text-white">{count}</p>
                      </div>
                    </div>
                    {count > 0 && (
                      <p className="text-xs text-indigo-400 mt-2 text-left">Klik untuk lihat daftar</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Belum Presensi</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={handleNotPresensiClick}
                disabled={notRecordedAttendees.length === 0}
                className={`p-4 rounded-2xl transition-all hover:scale-[1.02] ${notRecordedAttendees.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-400">Belum Presensi</p>
                    <p className="text-2xl font-bold text-white">{notRecordedAttendees.length}</p>
                  </div>
                </div>
                {notRecordedAttendees.length > 0 && (
                  <p className="text-xs text-indigo-400 mt-2 text-left">Klik untuk lihat daftar</p>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
