import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Language } from '../interfaces/language';

@Component({
  selector: 'app-optionsTab',
  templateUrl: 'optionsTab.page.html',
  styleUrls: ['optionsTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule, IonList, IonItem, IonSelect, IonSelectOption, IonLabel, FormsModule, CommonModule]
})
export class OptionsTabPage {

  public selectedLanguage: string = 'en';

  public allowedLanguages: Language[] = [];

  constructor(public translateService: TranslateService) { 
    const languages: string[] = translateService.getLangs();

    languages.forEach((language: string) => {
      if(language == 'en'){
        this.allowedLanguages.push({ code: 'en', name: 'ENGLISH' });
        return;
      }

      if(language == 'cy'){
        this.allowedLanguages.push({ code: 'cy', name: 'WELSH' });
        return;
      }
    });
  }

  public changeLanguage() {
    if(this.translateService.getLangs().includes(this.selectedLanguage)){
      this.translateService.use(this.selectedLanguage);
    }
  }

}
