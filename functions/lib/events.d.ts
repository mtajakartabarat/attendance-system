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
export declare function getEvents(): Promise<EventResponse[]>;
export declare function getEventByCode(accessCode: string): Promise<EventResponse | null>;
//# sourceMappingURL=events.d.ts.map