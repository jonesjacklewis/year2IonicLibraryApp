export interface Book {
    isbn: string;
    title: string;
    author: string;
    pageCount: number;
    publishedDate: Date;
    imageUrl: string;
}

export interface OpenLibraryResponse {
    numFound: number;
    docs: OpenLibraryBook[];
}

export interface OpenLibraryBook {
    isbn: string[];
    title: string;
    author_name: string[];
    publish_date: string[];
    number_of_pages_median: number;
    cover_i: number;
}

export interface OfflineBook{
    title: string;
    author: string;
    isbn: string;
    isbn13: string;
    language: string;
    first_publish_date: string;
    pageCount: number;
    avg_rating: number;
    number_of_ratings: number;
    weighted_rating: number;
    imageUrl: string;
}