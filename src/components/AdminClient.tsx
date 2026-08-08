'use client';

import { useCallback, useEffect, useSyncExternalStore, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Event } from '@/types';
import {
  ClipboardList, Lock, Mail, LogOut, Loader2, AlertCircle,
  CalendarPlus, Eye, Pencil, Trash2, X, Users,
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'adminmta234';
const AUTH_KEY = 'attendance_admin_auth';

let authSnapshot = typeof window !== 'undefined' ? localStorage.getItem(AUTH_KEY) === 'true' : false;
const authListeners = new Set<() => void>();

function subscribeAuth(listener: () => void) {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

function getAuthSnapshot() {
  return authSnapshot;
}

function getServerAuthSnapshot() {
  return false;
}

function setAuth(value: boolean) {
  authSnapshot = value;
  if (value) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
  authListeners.forEach(listener => listener());
}

function useAdminAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
}

interface EventForm {
  name: string;
  event_month: string;
  event_year: string;
  access_code: string;
  access_code_expiration: string;
}

const emptyForm: EventForm = {
  name: '',
  event_month: '',
  event_year: String(new Date().getFullYear()),
  access_code: '',
  access_code_expiration: new Date().toISOString().split('T')[0],
};

export default function AdminClient() {
  const authed = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[] | null>(null);
  const loading = events === null;
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    setError(null);
    try {
      setEvents(await api.getEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    api.getEvents().then(
      (data) => {
        if (cancelled) return;
        setError(null);
        setEvents(data);
      },
      (err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat data');
        setEvents([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAuth(true);
      setLoginError(null);
      setEmail('');
      setPassword('');
    } else {
      setLoginError('Email atau password salah');
    }
  };

  const handleLogout = () => {
    setAuth(false);
    setEvents([]);
  };

  const handleDelete = async (event: Event) => {
    if (!window.confirm(`Hapus acara "${event.name}" beserta seluruh data absensinya?`)) return;
    setDeleting(event.id);
    setError(null);
    try {
      await api.deleteEvent(event.id);
      setEvents(prev => (prev ?? []).filter(e => e.id !== event.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus acara');
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (event: Event) => {
    setEditing(event);
    setForm({
      name: event.name,
      event_month: event.event_month,
      event_year: event.event_year,
      access_code: event.access_code,
      access_code_expiration: event.access_code_expiration,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.event_month.trim() || !form.event_year.trim() || !form.access_code.trim()) {
      setFormError('Semua kolom wajib diisi');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.updateEvent({ id: editing.id, ...form });
      } else {
        await api.createEvent(form);
      }
      setShowForm(false);
      await loadEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan acara');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      {!authed ? (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#6366f1' }}>
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin</h2>
              <p className="text-slate-400">Masuk untuk mengelola acara</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 p-6 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full h-14 rounded-xl text-lg font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)' }}
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
                <p className="text-sm text-slate-400">Kelola acara dan ekspor absensi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: '#6366f1' }}
              >
                <CalendarPlus className="w-4 h-4" />
                Buat Acara
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors border"
                style={{ borderColor: '#2a2a3a' }}
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl text-red-400 text-sm bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              Belum ada acara. Buat acara pertama Anda.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 transition-all"
                  style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{event.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {event.event_month} {event.event_year}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kode: <span className="font-mono text-indigo-400">{event.access_code}</span>
                      {' · '}Berlaku s.d. {event.access_code_expiration}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      <Eye className="w-4 h-4" />
                      Lihat
                    </Link>
                    <button
                      onClick={() => openEdit(event)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-indigo-400 border border-indigo-500/30 transition-all hover:bg-indigo-500/10"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      disabled={deleting === event.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 border border-red-500/30 transition-all hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deleting === event.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="relative w-full max-w-lg rounded-2xl p-6 animate-scale-in" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a3a' }}>
                <button
                  onClick={() => setShowForm(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-4">
                  {editing ? 'Edit Acara' : 'Buat Acara'}
                </h3>

                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Nama Acara</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Contoh: Kajian Gelombang"
                      className="w-full h-12 px-4 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                      style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Bulan</label>
                      <input
                        type="text"
                        value={form.event_month}
                        onChange={(e) => setForm({ ...form, event_month: e.target.value })}
                        placeholder="Contoh: Januari"
                        className="w-full h-12 px-4 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                        style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">Tahun</label>
                      <input
                        type="number"
                        value={form.event_year}
                        onChange={(e) => setForm({ ...form, event_year: e.target.value })}
                        placeholder="Contoh: 2026"
                        className="w-full h-12 px-4 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                        style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Kode Akses</label>
                    <input
                      type="text"
                      value={form.access_code}
                      onChange={(e) => setForm({ ...form, access_code: e.target.value })}
                      placeholder="Contoh: KAJIAN2026"
                      className="w-full h-12 px-4 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                      style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Berlaku Sampai</label>
                    <input
                      type="date"
                      value={form.access_code_expiration}
                      onChange={(e) => setForm({ ...form, access_code_expiration: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl text-white focus:outline-none"
                      style={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a' }}
                    />
                  </div>

                  {formError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {formError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 h-12 rounded-xl font-medium text-slate-300 border transition-colors hover:bg-white/5"
                      style={{ borderColor: '#2a2a3a' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 h-12 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#6366f1' }}
                    >
                      {saving ? 'Menyimpan...' : editing ? 'Perbarui' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
