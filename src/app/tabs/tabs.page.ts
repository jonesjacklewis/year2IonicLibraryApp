import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { eyeOutline, addCircleOutline, mapOutline, cogOutline, searchCircleOutline, scanCircleOutline, backspaceOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, TranslateModule],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(public translateService: TranslateService) {
    addIcons({ eyeOutline, addCircleOutline, mapOutline, cogOutline,searchCircleOutline, scanCircleOutline, backspaceOutline });
  }
}
