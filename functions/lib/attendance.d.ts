export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'kerja' | 'pulang_kampung' | 'tanpa_keterangan';
export interface AttendanceRecord {
    id: number;
    attendee_id: number;
    event_id: number;
    status: AttendanceStatus;
    recorded_at: string;
}
export interface AttendanceStats {
    total: number;
    byGender: Record<string, number>;
    byStatus: Record<AttendanceStatus, number>;
}
export interface AttendanceReport {
    event_id: number;
    stats: AttendanceStats;
    records: {
        id: number;
        attendee_id: number;
        nama: string;
        perwakilan: string;
        cabang: string;
        gender: string;
        status: AttendanceStatus;
        recorded_at: string;
    }[];
}
export declare function recordAttendance(attendeeId: number, eventId: number, status: AttendanceStatus): Promise<{
    success: boolean;
    record: {
        id: number;
        attendee_id: number;
        event_id: number;
        status: string;
    };
}>;
export declare function getAttendanceReport(eventId: number): Promise<AttendanceReport>;
//# sourceMappingURL=attendance.d.ts.map