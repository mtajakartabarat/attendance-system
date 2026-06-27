export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'kerja' | 'pulang_kampung' | 'tanpa_keterangan';

export interface Attendee {
  id: number;
  nama: string;
  perwakilan: string;
  cabang: string;
  gender: 'laki-laki' | 'perempuan';
}

export interface Event {
  id: number;
  name: string;
  event_month: string;
  event_year: string;
  access_code: string;
  access_code_expiration: string;
}

export interface AttendanceStats {
  total: number;
  byGender: Record<string, number>;
  byStatus: Record<AttendanceStatus, number>;
}

export interface AttendanceRecord {
  id: number;
  attendee_id: number;
  nama: string;
  perwakilan: string;
  cabang: string;
  gender: string;
  status: AttendanceStatus;
  recorded_at: string;
}

export interface AttendanceReport {
  event_id: number;
  stats: AttendanceStats;
  records: AttendanceRecord[];
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: 'Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  kerja: 'Kerja',
  pulang_kampung: 'Pulang Kampung',
  tanpa_keterangan: 'Tanpa Keterangan',
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  hadir: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  izin: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sakit: 'bg-red-500/20 text-red-400 border-red-500/30',
  kerja: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pulang_kampung: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  tanpa_keterangan: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};
