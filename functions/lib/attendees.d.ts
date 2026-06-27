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
export declare function getAttendees(): Promise<AttendeeResponse[]>;
export declare function searchAttendees(searchQuery: string): Promise<AttendeeResponse[]>;
//# sourceMappingURL=attendees.d.ts.map