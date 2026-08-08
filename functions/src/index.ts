import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {getEvents as getEventsDb, getEventByCode as getEventByCodeDb, createEvent as createEventDb, updateEvent as updateEventDb, deleteEvent as deleteEventDb} from "./events.js";
import {getAttendees as getAttendeesDb, searchAttendees as searchAttendeesDb} from "./attendees.js";
import {checkAttendance as checkAttendanceDb, recordAttendance as recordAttendanceDb, getAttendanceReport as getAttendanceReportDb, exportAttendanceCsv as exportAttendanceCsvDb} from "./attendance.js";

setGlobalOptions({maxInstances: 10, region: "asia-southeast2"});

export const getEvents = onCall(async () => {
  try {
    const events = await getEventsDb();
    logger.info("Fetched events", {count: events.length});
    return {success: true, data: events};
  } catch (error) {
    logger.error("Failed to fetch events", error);
    throw new HttpsError("internal", "Failed to fetch events");
  }
});

export const getEventByCode = onCall(async (request) => {
  const {accessCode} = request.data;
  if (!accessCode) {
    throw new HttpsError("invalid-argument", "accessCode is required");
  }

  try {
    const event = await getEventByCodeDb(accessCode);
    return {success: true, data: event};
  } catch (error) {
    logger.error("Failed to fetch event by code", error);
    throw new HttpsError("internal", "Failed to fetch event");
  }
});

export const getAttendees = onCall(async () => {
  try {
    const attendees = await getAttendeesDb();
    logger.info("Fetched attendees", {count: attendees.length});
    return {success: true, data: attendees};
  } catch (error) {
    logger.error("Failed to fetch attendees", error);
    throw new HttpsError("internal", "Failed to fetch attendees");
  }
});

export const searchAttendees = onCall(async (request) => {
  const {query: searchQuery} = request.data;

  try {
    const attendees = await searchAttendeesDb(searchQuery || "");
    return {success: true, data: attendees};
  } catch (error) {
    logger.error("Failed to search attendees", error);
    throw new HttpsError("internal", "Failed to search attendees");
  }
});

export const recordAttendance = onCall(async (request) => {
  const {attendeeId, eventId, status, info} = request.data;

  if (!attendeeId || !eventId || !status) {
    throw new HttpsError("invalid-argument", "attendeeId, eventId, and status are required");
  }

  try {
    const result = await recordAttendanceDb(attendeeId, eventId, status, typeof info === "string" ? info : "");
    logger.info("Recorded attendance", {attendeeId, eventId, status, updated: result.updated});
    return {success: true, data: {record: result.record, updated: result.updated}};
  } catch (error) {
    logger.error("Failed to record attendance", error);
    const message = error instanceof Error ? error.message : "Failed to record attendance";
    if (message.startsWith("Invalid status")) {
      throw new HttpsError("invalid-argument", message);
    }
    throw new HttpsError("internal", message);
  }
});

export const checkAttendance = onCall(async (request) => {
  const {attendeeId, eventId} = request.data;

  if (!attendeeId || !eventId) {
    throw new HttpsError("invalid-argument", "attendeeId and eventId are required");
  }

  try {
    const result = await checkAttendanceDb(attendeeId, eventId);
    return {success: true, data: result};
  } catch (error) {
    logger.error("Failed to check attendance", error);
    throw new HttpsError("internal", "Failed to check attendance");
  }
});

export const getAttendanceReport = onCall(async (request) => {
  const {eventId} = request.data;

  if (!eventId) {
    throw new HttpsError("invalid-argument", "eventId is required");
  }

  try {
    const report = await getAttendanceReportDb(eventId);
    return {success: true, data: report};
  } catch (error) {
    logger.error("Failed to get attendance report", error);
    throw new HttpsError("internal", "Failed to get attendance report");
  }
});

export const exportAttendance = onCall(async (request) => {
  const {eventId} = request.data;

  if (!eventId) {
    throw new HttpsError("invalid-argument", "eventId is required");
  }

  try {
    const csv = await exportAttendanceCsvDb(Number(eventId));
    logger.info("Exported attendance CSV", {eventId, bytes: csv.length});
    return {success: true, data: csv};
  } catch (error) {
    logger.error("Failed to export attendance CSV", error);
    throw new HttpsError("internal", "Failed to export attendance CSV");
  }
});

export const createEvent = onCall(async (request) => {
  const {name, event_month, event_year, access_code, access_code_expiration} = request.data;
  if (!name || !event_month || !event_year || !access_code) {
    throw new HttpsError("invalid-argument", "Missing required fields for event creation");
  }
  try {
    const event = await createEventDb({
      name,
      event_month,
      event_year,
      access_code,
      access_code_expiration: access_code_expiration || new Date().toISOString().split("T")[0],
    });
    logger.info("Created event", {id: event.id, name: event.name});
    return {success: true, data: event};
  } catch (error) {
    logger.error("Failed to create event", error);
    throw new HttpsError("internal", error instanceof Error ? error.message : "Failed to create event");
  }
});

export const updateEvent = onCall(async (request) => {
  const {id, name, event_month, event_year, access_code, access_code_expiration} = request.data;
  if (!id || !name || !event_month || !event_year || !access_code) {
    throw new HttpsError("invalid-argument", "Missing required fields for event update");
  }
  try {
    const event = await updateEventDb({
      id: Number(id),
      name,
      event_month,
      event_year,
      access_code,
      access_code_expiration: access_code_expiration || new Date().toISOString().split("T")[0],
    });
    logger.info("Updated event", {id: event.id, name: event.name});
    return {success: true, data: event};
  } catch (error) {
    logger.error("Failed to update event", error);
    const message = error instanceof Error ? error.message : "Failed to update event";
    if (message === "Event not found") {
      throw new HttpsError("not-found", message);
    }
    throw new HttpsError("internal", message);
  }
});

export const deleteEvent = onCall(async (request) => {
  const {id} = request.data;
  if (!id) {
    throw new HttpsError("invalid-argument", "Event ID is required");
  }
  try {
    const result = await deleteEventDb(Number(id));
    logger.info("Deleted event", {id});
    return {success: true, data: result};
  } catch (error) {
    logger.error("Failed to delete event", error);
    const message = error instanceof Error ? error.message : "Failed to delete event";
    if (message === "Event not found") {
      throw new HttpsError("not-found", message);
    }
    throw new HttpsError("internal", message);
  }
});
