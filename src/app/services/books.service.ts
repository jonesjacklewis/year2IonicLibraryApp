import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, throwError, lastValueFrom } from 'rxjs';
import { Book, OpenLibraryBook, OpenLibraryResponse } from '../interfaces/book';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class BooksService {

  constructor(private http: HttpClient) { }

  public async verifyIsbn(isbn: string){
    if(
      isbn.length < 10 ||
      isbn.length > 13
    ){
      return false;
    }
    
    if(isbn.length == 10){
      return this.verifyIsbn10(isbn);
    }

    return this.verifyIsbn13(isbn);
  }

  private parseDate(dateString: string){
    // support:
    // just years: 1999
    // years and months: 1999-01
    // full date: 1999-01-01
    // month day, year: January 1, 1999

    let date = moment(dateString, 'YYYY-MM-DD');

    if(date.isValid()){
      return date.toDate();
    }

    date = moment(dateString, 'YYYY-MM');

    if(date.isValid()){
      return date.toDate();
    }

    date = moment(dateString, 'YYYY');

    if(date.isValid()){
      return date.toDate();
    }

    date = moment(dateString, 'MMMM D, YYYY');

    if(date.isValid()){
      return date.toDate();
    }

    // return the epoch date if no valid date is found
    return new Date(0);
  }

  public async getBooksByApiByIsbn(isbn: string): Promise<Book[]>{
    const standardIsbn = isbn.replace(/-/g, '').replace(/ /g, '').trim();
    const endpoint = `https://openlibrary.org/search.json?isbn=${standardIsbn}`;

    const response = (await (lastValueFrom(this.http.get(endpoint)))) as OpenLibraryResponse;

    const numFound = response.numFound;

    const olBooks: OpenLibraryBook[] = response.docs;

    const books: Book[] = [];

    olBooks.forEach(olBook => {
      const author = olBook.author_name.length == 1 ? olBook.author_name[0] : olBook.author_name.join(', ');
      
      // get longest string from olBook.publish_date
      const publishedDateString = olBook.publish_date.reduce((a, b) => a.length > b.length ? a : b, '');
      const publishDate = this.parseDate(publishedDateString);

      const imageUrl = olBook.cover_i ? `https://covers.openlibrary.org/b/id/${olBook.cover_i}-M.jpg` : '';

      const book: Book = {
        isbn: standardIsbn,
        title: olBook.title,
        author: author,
        pageCount: olBook.number_of_pages_median,
        publishedDate: publishDate,
        imageUrl: imageUrl
      };

      books.push(book);
    });

    return books;
  }

  private async verifyIsbn10(isbn: string){
    const isbnArray = isbn.split('');
    let checkSum: number | string = 0;

    for(let i = 0; i < 9; i++){
      checkSum += parseInt(isbnArray[i]) * (i + 1);
    }

    checkSum = checkSum % 11;

    if(checkSum == 10){
      checkSum = 'X';
    }

    return checkSum == isbnArray[9];
  }

  private async verifyIsbn13(isbn: string){
    const isbnArray = isbn.split('');
    let checkSum: number = 0;

    for(let i = 0; i < 12; i++){
      checkSum += parseInt(isbnArray[i]) * (i % 2 == 0 ? 1 : 3);
    }

    checkSum = 10 - (checkSum % 10);

    if(checkSum == 10){
      checkSum = 0;
    }

    return `${checkSum}` == isbnArray[12];
  }
}
