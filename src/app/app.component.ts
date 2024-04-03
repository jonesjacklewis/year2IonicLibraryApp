import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    public translate: TranslateService,
    public dataService: DataService
  ) {
    translate.addLangs(['en-GB', 'cy']);

    this.dataService.initDB().then(() => {

      dataService.getConfig('language').then((language: string) => {
        translate.setDefaultLang(language);
        translate.use(language);
      }).catch(() => {
        translate.setDefaultLang('en-GB');
        translate.use('en-GB');
      });
    });
  }

}
