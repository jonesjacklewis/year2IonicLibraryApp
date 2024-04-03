import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';


@Component({
  selector: 'app-addBooksTab',
  templateUrl: 'addBooksTab.page.html',
  styleUrls: ['addBooksTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class AddBooksTabPage {

  constructor() {}

}
