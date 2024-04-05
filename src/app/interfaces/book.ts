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
    title: string;
    author_name: string[];
    publish_date: string[];
    number_of_pages_median: number;
    cover_i: number;
}