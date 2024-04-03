import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-viewBooksTab',
  templateUrl: 'viewBooksTab.page.html',
  styleUrls: ['viewBooksTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule],
})
export class ViewBooksTabPage {

  constructor(public translate: TranslateService) {}

  
}
