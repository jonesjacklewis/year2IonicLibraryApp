import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-mapModeTab',
  templateUrl: 'mapModeTab.page.html',
  styleUrls: ['mapModeTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class MapModeTabPage {
  constructor() {}
}
