import {query} from "./db.js";

export interface AttendeeRow {
  id: number;
  name: string;
  perwakilan: string;
  cabang: string;
  gender: string;
}

export interface AttendeeResponse {
  id: number;
  nama: string;
  perwakilan: string;
  cabang: string;
  gender: string;
}

function mapGender(dbGender: string): string {
  if (dbGender.toUpperCase() === "M") return "laki-laki";
  if (dbGender.toUpperCase() === "F") return "perempuan";
  return dbGender.toLowerCase();
}

function toResponse(a: AttendeeRow): AttendeeResponse {
  return {
    id: a.id,
    nama: a.name,
    perwakilan: a.perwakilan,
    cabang: a.cabang ?? "",
    gender: mapGender(a.gender),
  };
}

export async function getAttendees(): Promise<AttendeeResponse[]> {
  const result = await query(
    "SELECT id, name, perwakilan, cabang, gender FROM attendees ORDER BY name"
  );
  return result.rows.map(toResponse);
}

export async function searchAttendees(searchQuery: string): Promise<AttendeeResponse[]> {
  if (!searchQuery || !searchQuery.trim()) {
    return getAttendees();
  }

  const q = `%${searchQuery.toLowerCase()}%`;
  const result = await query(
    `SELECT id, name, perwakilan, cabang, gender FROM attendees
     WHERE LOWER(name) LIKE $1 OR LOWER(perwakilan) LIKE $1 OR LOWER(cabang) LIKE $1
     ORDER BY name`,
    [q]
  );
  return result.rows.map(toResponse);
}
