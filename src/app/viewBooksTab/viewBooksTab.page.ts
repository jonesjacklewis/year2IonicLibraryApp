import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpeechService } from '../services/speech.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-viewBooksTab',
  templateUrl: 'viewBooksTab.page.html',
  styleUrls: ['viewBooksTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule],
})
export class ViewBooksTabPage {

  constructor(public translateService: TranslateService, private speechService: SpeechService, private platform: Platform) {}

  async ionViewWillEnter() {
    this.platform.ready().then(async () => {
    if(await this.speechService.textToSpeechIsEnabled()){
      this.speechService.speak(this.translateService.instant('VIEW_BOOKS_TAB'));
    }
  });
  }
  
}
