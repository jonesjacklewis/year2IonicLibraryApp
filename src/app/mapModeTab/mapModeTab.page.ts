import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-mapModeTab',
  templateUrl: 'mapModeTab.page.html',
  styleUrls: ['mapModeTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule],
})
export class MapModeTabPage {
  constructor(public translateService: TranslateService) {}
}
