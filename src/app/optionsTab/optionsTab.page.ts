import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonSelect, IonSelectOption, IonLabel, IonToggle } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Language } from '../interfaces/language';
import { DataService } from '../services/data.service';

import { SpeechService } from '../services/speech.service';

import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-optionsTab',
  templateUrl: 'optionsTab.page.html',
  styleUrls: ['optionsTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule, IonList, IonItem, IonSelect, IonSelectOption, IonLabel, IonToggle, FormsModule, CommonModule]
})
export class OptionsTabPage {

  public selectedLanguage: string = 'en-GB';
  public textToSpeech: boolean = false;
  public isIOS: boolean = this.platform.is('ios');

  public allowedLanguages: Language[] = [];


  constructor(public translateService: TranslateService, public dataService: DataService, public speechService: SpeechService, private platform: Platform) { 
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

  async ionViewWillEnter(){
    this.textToSpeech = await this.speechService.textToSpeechIsEnabled();

    if(this.textToSpeech){
      this.speechService.speak(this.translateService.instant('OPTIONS_TAB'));
    }
  }


  public async changeLanguage() {
    if(this.translateService.getLangs().includes(this.selectedLanguage)){
      this.translateService.use(this.selectedLanguage);
      await this.dataService.updateConfig('language', 'string', this.selectedLanguage);


      if(!await this.speechService.isSupportedLanguage(this.selectedLanguage)){
        
        this.translateService.getTranslation(this.selectedLanguage).subscribe(async (translation: any) => {
          alert(translation.TTS_NOT_SUPPORTED);
          this.textToSpeech = await this.speechService.disableTextToSpeech();
        });
       
      }

    }
  }

  public async toggleTts(){
    this.textToSpeech = await this.speechService.toggleTextToSpeech();
    if(this.textToSpeech){
      await this.speechService.speak('Text to speech enabled');
    }
  }

}
