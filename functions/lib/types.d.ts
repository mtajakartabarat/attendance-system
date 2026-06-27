export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'kerja' | 'pulang_kampung' | 'tanpa_keterangan';
export interface AttendanceStats {
    total: number;
    byGender: Record<string, number>;
    byStatus: Record<AttendanceStatus, number>;
}
export declare const STATUS_LABELS: Record<AttendanceStatus, string>;
//# sourceMappingURL=types.d.ts.map