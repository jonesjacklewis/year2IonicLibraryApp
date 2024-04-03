import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Language } from '../interfaces/language';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-optionsTab',
  templateUrl: 'optionsTab.page.html',
  styleUrls: ['optionsTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule, IonList, IonItem, IonSelect, IonSelectOption, IonLabel, FormsModule, CommonModule]
})
export class OptionsTabPage {

  public selectedLanguage: string = 'en-GB';
  public textToSpeech: boolean = false;

  public allowedLanguages: Language[] = [];

  constructor(public translateService: TranslateService, public dataService: DataService) { 
    const languages: string[] = translateService.getLangs();

    languages.forEach((language: string) => {
      if(language == 'en-GB'){
        this.allowedLanguages.push({ code: 'en-GB', name: 'ENGLISH' });
        return;
      }

      if(language == 'cy'){
        this.allowedLanguages.push({ code: 'cy', name: 'WELSH' });
        return;
      }
    });

    if(this.translateService.currentLang){
      this.selectedLanguage = this.translateService.currentLang;
    }
  }

  public async changeLanguage() {
    if(this.translateService.getLangs().includes(this.selectedLanguage)){
      this.translateService.use(this.selectedLanguage);
      await this.dataService.updateConfig('language', 'string', this.selectedLanguage);
    }
  }

}
