import { Injectable } from '@angular/core';

import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { DataService } from './data.service';
import { Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {

  private ttsEnabled: boolean = false;
  private language: string = 'en-GB';

  constructor(private dataService: DataService, private translateService: TranslateService) {
    this.dataService.getConfig('tts').then((tts: boolean) => {
      this.ttsEnabled = tts;
    });
  }

  public async textToSpeechIsEnabled(): Promise<boolean> {
    this.ttsEnabled = await this.dataService.getConfig('tts') as boolean;
    return this.ttsEnabled;
  }

  public async enableTextToSpeech(): Promise<boolean> {
    const languages: string[] = (await TextToSpeech.getSupportedLanguages()).languages;

    if(languages.includes(this.translateService.currentLang)){
      this.ttsEnabled = true;
      await this.dataService.updateConfig('tts', 'boolean', this.ttsEnabled);
      return true;
    }

    alert(this.translateService.instant('TTS_NOT_SUPPORTED'));
    return false;
  }

  public async toggleTextToSpeech(): Promise<boolean> {
    this.ttsEnabled = !this.ttsEnabled;

    if(this.ttsEnabled){
      const languages: string[] = (await TextToSpeech.getSupportedLanguages()).languages;
        
        if(!languages.includes(this.translateService.currentLang)){
          alert(this.translateService.instant('TTS_NOT_SUPPORTED'));
          this.ttsEnabled = false;
          await this.dataService.updateConfig('tts', 'boolean', this.ttsEnabled);
          return false;
        }
    }

    await this.dataService.updateConfig('tts', 'boolean', this.ttsEnabled);
    return this.ttsEnabled;
  }

  public async speak(text: string) {
    if(this.ttsEnabled){
      const speak = async () => {
        await TextToSpeech.speak({
          text: text,
          lang: this.translateService.currentLang,
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        });
      };

      await speak();
    }
  }
}