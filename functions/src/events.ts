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

export interface CreateEventParams {
  name: string;
  event_month: string;
  event_year: string | number;
  access_code: string;
  access_code_expiration: string;
}

export interface UpdateEventParams extends CreateEventParams {
  id: number;
}

export async function createEvent(data: CreateEventParams): Promise<EventResponse> {
  const result = await query(
    `INSERT INTO events (name, event_month, event_year, access_code, access_code_expiration)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, event_month, event_year, access_code, access_code_expiration`,
    [
      data.name,
      data.event_month,
      Number(data.event_year),
      data.access_code.toUpperCase(),
      data.access_code_expiration,
    ]
  );
  return toResponse(result.rows[0]);
}

export async function updateEvent(data: UpdateEventParams): Promise<EventResponse> {
  const result = await query(
    `UPDATE events
     SET name = $1, event_month = $2, event_year = $3, access_code = $4, access_code_expiration = $5
     WHERE id = $6
     RETURNING id, name, event_month, event_year, access_code, access_code_expiration`,
    [
      data.name,
      data.event_month,
      Number(data.event_year),
      data.access_code.toUpperCase(),
      data.access_code_expiration,
      data.id,
    ]
  );
  if (result.rows.length === 0) {
    throw new Error("Event not found");
  }
  return toResponse(result.rows[0]);
}

export async function deleteEvent(id: number): Promise<{ success: boolean }> {
  await query("DELETE FROM attendance WHERE event_id = $1", [id]);
  const result = await query("DELETE FROM events WHERE id = $1 RETURNING id", [id]);
  if (result.rows.length === 0) {
    throw new Error("Event not found");
  }
  return { success: true };
}
