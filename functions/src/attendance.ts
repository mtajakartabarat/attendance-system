import {query} from "./db.js";

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "kerja" | "pulang_kampung" | "tanpa_keterangan";

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

export interface AttendanceReportRow {
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
  records: AttendanceReportRow[];
}

const VALID_STATUSES: AttendanceStatus[] = ["hadir", "izin", "sakit", "kerja", "pulang_kampung", "tanpa_keterangan"];

export async function recordAttendance(
  attendeeId: number,
  eventId: number,
  status: AttendanceStatus
): Promise<{success: boolean; record: {id: number; attendee_id: number; event_id: number; status: string}; updated: boolean}> {
  if (!attendeeId || !eventId || !status) {
    throw new Error("attendee_id, event_id, and status are required");
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const existing = await query(
    "SELECT id FROM attendances WHERE attendee_id = $1 AND event_id = $2 LIMIT 1",
    [attendeeId, eventId]
  );

  let record: {id: number; attendee_id: number; event_id: number; status: string};
  let updated = false;

  if (existing.rows.length > 0) {
    const result = await query(
      `UPDATE attendances SET status = $3 WHERE attendee_id = $1 AND event_id = $2
       RETURNING id, attendee_id, event_id, status`,
      [attendeeId, eventId, status]
    );
    record = result.rows[0];
    updated = true;
  } else {
    const result = await query(
      `INSERT INTO attendances (attendee_id, event_id, status)
       VALUES ($1, $2, $3)
       RETURNING id, attendee_id, event_id, status`,
      [attendeeId, eventId, status]
    );
    record = result.rows[0];
  }

  return {success: true, record, updated};
}

export async function checkAttendance(
  attendeeId: number,
  eventId: number
): Promise<{exists: boolean; status: AttendanceStatus | null}> {
  if (!attendeeId || !eventId) {
    throw new Error("attendee_id and event_id are required");
  }

  const result = await query(
    "SELECT status FROM attendances WHERE attendee_id = $1 AND event_id = $2 LIMIT 1",
    [attendeeId, eventId]
  );

  if (result.rows.length === 0) {
    return {exists: false, status: null};
  }

  return {exists: true, status: result.rows[0].status as AttendanceStatus};
}

function mapGender(dbGender: string): string {
  if (dbGender.toUpperCase() === "M") return "laki-laki";
  if (dbGender.toUpperCase() === "F") return "perempuan";
  return dbGender.toLowerCase();
}

export async function getAttendanceReport(eventId: number): Promise<AttendanceReport> {
  if (!eventId) {
    throw new Error("event_id is required");
  }

  const recordsResult = await query(
    `SELECT DISTINCT ON (a.attendee_id) a.id, a.attendee_id, a.event_id, a.status, a.created_at as recorded_at,
            att.name, att.perwakilan, att.cabang, att.gender
     FROM attendances a
     JOIN attendees att ON att.id = a.attendee_id
     WHERE a.event_id = $1
     ORDER BY a.attendee_id, a.created_at DESC`,
    [eventId]
  );

  const byGender: Record<string, number> = {"laki-laki": 0, "perempuan": 0};
  const byStatus: Record<AttendanceStatus, number> = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    kerja: 0,
    pulang_kampung: 0,
    tanpa_keterangan: 0,
  };

  const records: AttendanceReportRow[] = recordsResult.rows.map((r: Record<string, unknown>) => {
    const status = r.status as AttendanceStatus;
    const gender = mapGender(r.gender as string);

    byStatus[status] = (byStatus[status] || 0) + 1;
    byGender[gender] = (byGender[gender] || 0) + 1;

    return {
      id: r.id as number,
      attendee_id: r.attendee_id as number,
      nama: r.name as string,
      perwakilan: r.perwakilan as string,
      cabang: (r.cabang as string) ?? "",
      gender,
      status,
      recorded_at: r.recorded_at as string,
    };
  });

  return {
    event_id: eventId,
    stats: {total: records.length, byGender, byStatus},
    records,
  };
}
