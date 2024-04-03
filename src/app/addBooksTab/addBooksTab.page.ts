import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpeechService } from '../services/speech.service';


@Component({
  selector: 'app-addBooksTab',
  templateUrl: 'addBooksTab.page.html',
  styleUrls: ['addBooksTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule]
})
export class AddBooksTabPage {

  constructor(public translateService: TranslateService, public speechService: SpeechService) {}

  async ionViewWillEnter() {
    if(await this.speechService.textToSpeechIsEnabled()){
      this.speechService.speak(this.translateService.instant('ADD_BOOKS_TAB'));
    }
  }

}
