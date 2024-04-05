import { Component } from '@angular/core';
import { IonInput, IonSegment, IonSegmentButton, IonHeader, IonToolbar, IonTitle, IonCardSubtitle, IonCardTitle, IonCardContent, IonList, IonGrid, IonRow, IonCol, IonContent, IonButton, IonIcon, IonLabel, IonItem, IonCard, IonCardHeader } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpeechService } from '../services/speech.service';
import { addIcons } from 'ionicons';
import { addCircleOutline, searchCircleOutline, scanCircleOutline, backspaceOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BooksService } from '../services/books.service';
import { HttpClient } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { DataService } from '../services/data.service';
import { Book } from '../interfaces/book';
import * as moment from 'moment';
import { Network } from '@capacitor/network';



@Component({
  selector: 'app-addBooksTab',
  templateUrl: 'addBooksTab.page.html',
  styleUrls: ['addBooksTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonSegment, IonSegmentButton, IonCard, IonCardTitle, IonCardSubtitle, IonCardContent, IonInput, IonList, IonGrid, IonRow, IonCol, IonCardHeader, IonToolbar, IonTitle, IonContent, TranslateModule, IonButton, IonIcon, IonLabel, CommonModule, FormsModule, IonItem, ReactiveFormsModule],
})
export class AddBooksTabPage {

  // Add Book Manually Vars
  public showAddBookManually = false;
  public isbn: string = '';
  public title: string = '';
  public author: string = '';
  public pageCount: number = 0;
  public publishedDate: Date | string = new Date();
  public imageUrl: string = '';
  public formValid: boolean = false;

  // Search Book Vars
  public showAddBookSearch = false;
  public searchType: string = "";
  public books: Book[] = [];

  constructor(
    public translateService: TranslateService, public speechService: SpeechService, public bookService: BooksService, private http: HttpClient, private dataService: DataService) { }

  async cancel() {
    this.isbn = '';
    this.title = '';
    this.author = '';
    this.pageCount = 0;
    this.publishedDate = new Date();
    this.imageUrl = '';
    this.formValid = false;
    this.showAddBookManually = false;
    this.showAddBookSearch = false;
    await this.speechService.speak(this.translateService.instant('CANCELING'));
  }

  async ionViewWillEnter() {
    addIcons({ addCircleOutline, searchCircleOutline, scanCircleOutline, backspaceOutline });
    if (await this.speechService.textToSpeechIsEnabled()) {
      this.speechService.speak(this.translateService.instant('ADD_BOOKS_TAB'));
    }
    await this.dataService.initDB();
  }

  async addBookManually() {
    await this.speechService.speak(this.translateService.instant('ADD_BOOK_MANUALLY'));
    this.showAddBookManually = true;
  }

  async addBookManuallyVerify() {
    this.formValid = true;
    await this.verifyIsbn();
    await this.verifyTitle();
    await this.verifyAuthor();
    await this.verifyPageCount();
    await this.verifyPublishedDate();
    await this.verifyImageUrl();

    if (this.formValid) {
      const date = new Date(this.publishedDate);

      const book: Book = {
        isbn: this.isbn,
        title: this.title,
        author: this.author,
        pageCount: this.pageCount,
        publishedDate: date,
        imageUrl: this.imageUrl
      }
      await this.dataService.addBook(book);
      this.isbn = '';
      this.title = '';
      this.author = '';
      this.pageCount = 0;
      this.publishedDate = new Date();
      this.imageUrl = '';
      this.showAddBookManually = false;
      this.formValid = false;
      // location.reload();
    }
  }

  async addBookSearch() {
    this.speechService.speak(this.translateService.instant('ADD_BOOK_SEARCH'));
    this.showAddBookSearch = true;
  }

  async addBookScan() {
    this.speechService.speak(this.translateService.instant('ADD_BOOK_SCAN'));
  }

  async ionViewWillLeave() {
    this.showAddBookManually = false;
  }

  async verifyIsbn(searchBooks: boolean = false) {
    const isbn = this.isbn.replace(/-/g, '').replace(/ /g, '');

    if (!await this.bookService.verifyIsbn(isbn)) {
      this.formValid = false;
      this.speechService.speak(this.translateService.instant('INVALID_ISBN'));
      alert(this.translateService.instant('INVALID_ISBN'));
      return;
    }


  }

  async verifyTitle() {
    if (this.title.length < 1) {
      this.formValid = false;
      await this.speechService.speak(this.translateService.instant('INVALID_TITLE'));
      alert(this.translateService.instant('INVALID_TITLE'));
      return;
    }
  }

  async verifyAuthor() {
    if (this.author.length < 1) {
      this.formValid = false;
      await this.speechService.speak(this.translateService.instant('INVALID_AUTHOR'));
      alert(this.translateService.instant('INVALID_AUTHOR'));
      return;
    }

  }

  async verifyPageCount() {
    if (this.pageCount < 1) {
      this.formValid = false;
      await this.speechService.speak(this.translateService.instant('INVALID_PAGE_COUNT'));
      alert(this.translateService.instant('INVALID_PAGE_COUNT'));
      return;
    }
  }

  async verifyPublishedDate() {
    const date = new Date(this.publishedDate);

    // format this.publishedDate as yyyy-MM-dd

    const formattedDate = moment(date).format('YYYY-MM-DD');

    this.publishedDate = formattedDate;

    // can't be in the future
    if (date > new Date()) {
      this.formValid = false;
      await this.speechService.speak(this.translateService.instant('INVALID_PUBLISHED_DATE'));
      alert(this.translateService.instant('INVALID_PUBLISHED_DATE'));
      return;
    }

  }

  async verifyImageUrl() {
    const url: string = this.imageUrl;
    // Simple URL validation (you might want to improve this)
    const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

    if (!urlPattern.test(url)) {
      this.formValid = false;
      await this.speechService.speak(this.translateService.instant('INVALID_IMAGE_URL'));
      alert(this.translateService.instant('INVALID_IMAGE_URL'));
      alert(this.translateService.instant('INVALID_IMAGE_URL'));
    }

    return this.http.head(url, { observe: 'response' }).pipe(
      map(async response => {
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.startsWith('image/')) {
          this.formValid = false;
          await this.speechService.speak(this.translateService.instant('INVALID_IMAGE_URL'));
          alert(this.translateService.instant('INVALID_IMAGE_URL'));
        }
      }),
      catchError(async () => throwError(async () => {
        this.formValid = false;
        await this.speechService.speak(this.translateService.instant('INVALID_IMAGE_URL'));
        alert(this.translateService.instant('INVALID_IMAGE_URL'));
        new Error('URL could not be reached or does not point to an image')
      }))
    );
  }

  async searchBookIsbn() {
    const hasConnection = await Network.getStatus();
    this.books = await this.bookService.getBooksByApiByIsbn(this.isbn, hasConnection.connected);
  }

  async searchBookTitle() {
    const hasConnection = await Network.getStatus();
    this.books = await this.bookService.getBooksByApiByTitle(this.title, hasConnection.connected);
  }

  async addBookSearchVerify(book: Book) {
    await this.dataService.addBook(book);
    this.showAddBookSearch = false;
    this.books = [];
  }


}
