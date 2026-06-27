import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {getEvents as getEventsDb, getEventByCode as getEventByCodeDb} from "./events.js";
import {getAttendees as getAttendeesDb, searchAttendees as searchAttendeesDb} from "./attendees.js";
import {checkAttendance as checkAttendanceDb, recordAttendance as recordAttendanceDb, getAttendanceReport as getAttendanceReportDb} from "./attendance.js";

setGlobalOptions({maxInstances: 10, region: "asia-southeast2"});

export const getEvents = onCall(async () => {
  try {
    const events = await getEventsDb();
    logger.info("Fetched events", {count: events.length});
    return {success: true, data: events};
  } catch (error) {
    logger.error("Failed to fetch events", error);
    throw new Error("Failed to fetch events");
  }
});

export const getEventByCode = onCall(async (request) => {
  const {accessCode} = request.data;
  if (!accessCode) {
    throw new Error("accessCode is required");
  }

  try {
    const event = await getEventByCodeDb(accessCode);
    return {success: true, data: event};
  } catch (error) {
    logger.error("Failed to fetch event by code", error);
    throw new Error("Failed to fetch event");
  }
});

export const getAttendees = onCall(async () => {
  try {
    const attendees = await getAttendeesDb();
    logger.info("Fetched attendees", {count: attendees.length});
    return {success: true, data: attendees};
  } catch (error) {
    logger.error("Failed to fetch attendees", error);
    throw new Error("Failed to fetch attendees");
  }
});

export const searchAttendees = onCall(async (request) => {
  const {query: searchQuery} = request.data;

  try {
    const attendees = await searchAttendeesDb(searchQuery || "");
    return {success: true, data: attendees};
  } catch (error) {
    logger.error("Failed to search attendees", error);
    throw new Error("Failed to search attendees");
  }
});

export const recordAttendance = onCall(async (request) => {
  const {attendeeId, eventId, status} = request.data;

  if (!attendeeId || !eventId || !status) {
    throw new Error("attendeeId, eventId, and status are required");
  }

  try {
    const result = await recordAttendanceDb(attendeeId, eventId, status);
    logger.info("Recorded attendance", {attendeeId, eventId, status, updated: result.updated});
    return {success: true, data: {record: result.record, updated: result.updated}};
  } catch (error) {
    logger.error("Failed to record attendance", error);
    throw new Error(error instanceof Error ? error.message : "Failed to record attendance");
  }
});

export const checkAttendance = onCall(async (request) => {
  const {attendeeId, eventId} = request.data;

  if (!attendeeId || !eventId) {
    throw new Error("attendeeId and eventId are required");
  }

  try {
    const result = await checkAttendanceDb(attendeeId, eventId);
    return {success: true, data: result};
  } catch (error) {
    logger.error("Failed to check attendance", error);
    throw new Error(error instanceof Error ? error.message : "Failed to check attendance");
  }
});

export const getAttendanceReport = onCall(async (request) => {
  const {eventId} = request.data;

  if (!eventId) {
    throw new Error("eventId is required");
  }

  try {
    const report = await getAttendanceReportDb(eventId);
    return {success: true, data: report};
  } catch (error) {
    logger.error("Failed to get attendance report", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get attendance report");
  }
});
