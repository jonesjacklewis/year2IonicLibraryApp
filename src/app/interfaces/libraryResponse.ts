export interface LibraryResponse {
    success: boolean;
    error: string | undefined;
    latitude: number | undefined;
    longitude: number | undefined;
    count: number | undefined;
    libraries: Library[] | undefined;
}

export interface Library {
    name: string;
    point: Point;
}

export interface Point {
    latitude: number;
    longitude: number;
}