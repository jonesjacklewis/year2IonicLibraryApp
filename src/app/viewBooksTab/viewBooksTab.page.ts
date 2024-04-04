import { Component } from '@angular/core';
import { IonList, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonCardSubtitle } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpeechService } from '../services/speech.service';
import { Platform } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { Book } from '../interfaces/book';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-viewBooksTab',
  templateUrl: 'viewBooksTab.page.html',
  styleUrls: ['viewBooksTab.page.scss'],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule, CommonModule, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonCardSubtitle],
})
export class ViewBooksTabPage {

  public books: Book[] = [];

  constructor(public translateService: TranslateService, private speechService: SpeechService, private platform: Platform, private dataService: DataService) {}

  async ionViewWillEnter() {
    await this.dataService.initDB();
    this.platform.ready().then(async () => {
    if(await this.speechService.textToSpeechIsEnabled()){
      this.speechService.speak(this.translateService.instant('VIEW_BOOKS_TAB'));
    }
  });
  }

  async ionViewDidEnter() {
    this.books = await this.dataService.getAllBooks();
    // filter out duplicate books by title
    this.books = this.books.filter((book, index, self) =>
      index === self.findIndex((t) => (
        t.title === book.title
      ))
    );

  }
  
}
