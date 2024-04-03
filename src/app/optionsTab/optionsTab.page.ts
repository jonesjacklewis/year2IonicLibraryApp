import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';


@Component({
  selector: 'app-optionsTab',
  templateUrl: 'optionsTab.page.html',
  styleUrls: ['optionsTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent]
})
export class OptionsTabPage {

  constructor() {}

}
