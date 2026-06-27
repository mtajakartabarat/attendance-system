import {query} from "./db.js";

export interface EventRow {
  id: number;
  name: string;
  event_month: string;
  event_year: number;
  access_code: string;
  access_code_expiration: string;
}

export interface EventResponse {
  id: number;
  name: string;
  event_month: string;
  event_year: string;
  access_code: string;
  access_code_expiration: string;
}

function toResponse(e: EventRow): EventResponse {
  return {
    id: e.id,
    name: e.name,
    event_month: e.event_month,
    event_year: String(e.event_year),
    access_code: e.access_code,
    access_code_expiration: e.access_code_expiration,
  };
}

export async function getEvents(): Promise<EventResponse[]> {
  const result = await query(
    "SELECT id, name, event_month, event_year, access_code, access_code_expiration FROM events ORDER BY id"
  );
  return result.rows.map(toResponse);
}

export async function getEventByCode(accessCode: string): Promise<EventResponse | null> {
  const result = await query(
    "SELECT id, name, event_month, event_year, access_code, access_code_expiration FROM events WHERE access_code = $1 LIMIT 1",
    [accessCode.toUpperCase()]
  );
  return result.rows.length > 0 ? toResponse(result.rows[0]) : null;
}
