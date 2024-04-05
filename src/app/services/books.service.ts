import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, throwError, lastValueFrom } from 'rxjs';
import { Book, OpenLibraryBook, OpenLibraryResponse } from '../interfaces/book';
import * as moment from 'moment';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class BooksService {

  constructor(private http: HttpClient, private dataService: DataService) { 
  }

  

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
    // year-month-dayTHH:MM:SS: 1813-01-28T00:00:00

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

    date = moment(dateString, 'YYYY-MM-DDTHH:mm:ss');

    if(date.isValid()){
      return date.toDate();
    }

    // return the epoch date if no valid date is found
    return new Date(0);
  }

  private async getBooksByIsbnNoConnection(isbn: string): Promise<Book[]>{
    await this.dataService.initDB();
    const offlineBooks: Book[] = await this.dataService.getAllOfflineBooks();

    return offlineBooks.filter(book => book.isbn == isbn);
  }

  private async getBooksByApiByIsbnConnection(isbn: string): Promise<Book[]>{
    const standardIsbn = isbn.replace(/-/g, '').replace(/ /g, '').trim();
    const endpoint = `https://openlibrary.org/search.json?isbn=${standardIsbn}`;

    const response = (await (lastValueFrom(this.http.get(endpoint)))) as OpenLibraryResponse;

    let olBooks: OpenLibraryBook[] = response.docs;

    const books: Book[] = [];

    if(olBooks.length > 50){
      olBooks = olBooks.slice(0, 50);
    }

    olBooks.forEach(olBook => {
      if(!olBook.author_name){
        return;
      }
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

  public async getBooksByApiByIsbn(isbn: string, hasConnection: boolean = true): Promise<Book[]>{
    if(!hasConnection){
      return this.getBooksByIsbnNoConnection(isbn);
    }

    return this.getBooksByApiByIsbnConnection(isbn);
  }

  private async getBooksByTitleNoConnection(title: string): Promise<Book[]>{
    await this.dataService.initDB();
    const offlineBooks: Book[] = await this.dataService.getAllOfflineBooks();

    alert(offlineBooks.length);

    return offlineBooks.filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
  }

  public async getBooksByApiByTitleConnection(title: string): Promise<Book[]>{
    
    const urlSafeTitle = encodeURIComponent(title);

    const endpoint = `https://openlibrary.org/search.json?title=${title}`;

    const response = (await (lastValueFrom(this.http.get(endpoint)))) as OpenLibraryResponse;

    const numFound = response.numFound;

    let olBooks: OpenLibraryBook[] = response.docs;

    const books: Book[] = [];

    if(olBooks.length > 50){
      olBooks = olBooks.slice(0, 50);
    }

    olBooks.forEach(olBook => {
      if(!olBook.author_name){
        return;
      }
      const author = olBook.author_name.length == 1 ? olBook.author_name[0] : olBook.author_name.join(', ');
      
      // get longest string from olBook.publish_date
      if(!olBook.publish_date){
        olBook.publish_date = [];
      }

      const publishedDateString = olBook.publish_date.reduce((a, b) => a.length > b.length ? a : b, '');
      const publishDate = this.parseDate(publishedDateString);

      const imageUrl = olBook.cover_i ? `https://covers.openlibrary.org/b/id/${olBook.cover_i}-M.jpg` : '';

      // if one is available, the isbn should be the one starting 978, else use the first
      if(!olBook.isbn){
        return;
      }
      const standardIsbn = olBook.isbn.find(isbn => isbn.startsWith('978')) || olBook.isbn[0];

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

  public async getBooksByApiByTitle(title: string, hasConnection: boolean = true): Promise<Book[]>{
    if(!hasConnection){
      return this.getBooksByTitleNoConnection(title);
    }

    return this.getBooksByApiByTitleConnection(title);
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
