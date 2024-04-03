import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'app-addBooksTab',
  templateUrl: 'addBooksTab.page.html',
  styleUrls: ['addBooksTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule]
})
export class AddBooksTabPage {

  constructor(public translateService: TranslateService) {}

}
