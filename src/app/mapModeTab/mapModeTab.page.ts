import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonSpinner } from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpeechService } from '../services/speech.service';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { LocationService } from '../services/location.service';

import { CommonModule } from '@angular/common';
import { Network, ConnectionStatus } from '@capacitor/network';

import * as L from 'leaflet';
import { Library, LibraryResponse } from '../interfaces/libraryResponse';
import { DataService } from '../services/data.service';



@Component({
  selector: 'app-mapModeTab',
  templateUrl: 'mapModeTab.page.html',
  styleUrls: ['mapModeTab.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, TranslateModule, HttpClientModule, IonItem, IonSpinner, CommonModule],
})
export class MapModeTabPage {

  private latitude: number = -1;
  private longitude: number = -1;

  public hasConnection: boolean = true;
  
  public showSpinner: boolean = false;

  constructor(public translateService: TranslateService, public speechService: SpeechService, private http: HttpClient, private locationService: LocationService, private dataService: DataService) { }

  async ionViewWillEnter() {
    if (await this.speechService.textToSpeechIsEnabled()) {
      this.speechService.speak(this.translateService.instant('MAP_MODE_TAB'));
    }
  }

  private libraries: Library[] = [
  ]

  async ngAfterViewInit() {
    const status = await Network.getStatus();



    if (status.connected) {
      this.showSpinner = true;
      await this.getLibrariesByLocation();
      setTimeout(() => {
        this.initMap();
        this.showSpinner = false;
      }, 500); // Adjust delay as needed
      return;
    }else{
      this.hasConnection = false;
    }

  }

  private async getLibrariesByLocationData(): Promise<void> {
    const { latitude, longitude } = await this.locationService.getLatitudeLongitude();

    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);

    const target: string = `https://uklibrariesapi.co.uk/latitude/${latitude}/longitude/${longitude}/count/10`;

    this.http.get(target).subscribe({
      next: async (response) => {
        // get response json
        const libraryResponse = response as LibraryResponse;

        await this.dataService.setLocalStorage('libraryResponse', libraryResponse);
        await this.dataService.setLocalStorage('libraryResponseTime', new Date().toISOString());
        await this.dataService.setLocalStorage('latitude', latitude);
        await this.dataService.setLocalStorage('longitude', longitude);

        if (!libraryResponse.success) {
          this.libraries = [];
          this.showSpinner = false;
        } else if (libraryResponse.libraries === undefined) {
          this.libraries = [];
          this.showSpinner = false;
        } else {
          this.libraries = libraryResponse.libraries;
          this.showSpinner = false;
        }



      },
      error: (error) => {
        alert(JSON.stringify(error));
        console.error('There was an error!', error);
      }
    });
  }

  private async getLibrariesByLocation(): Promise<void> {

    const result = await this.locationService.getLatitudeLongitude();

    const currentLatitude = result.latitude;
    const currentLongitude = result.longitude;

    this.latitude = parseFloat(currentLatitude);
    this.longitude = parseFloat(currentLongitude);

    const libraryResponseString = await this.dataService.getLocalStorage('libraryResponse');
    const timestampString = await this.dataService.getLocalStorage('libraryResponseTime');
    const cachedLatitudeString = await this.dataService.getLocalStorage('latitude');
    const cachedLongitudeString = await this.dataService.getLocalStorage('longitude');


    // if there isn't a cached response, get new data
    if (libraryResponseString === null) {
      await this.getLibrariesByLocationData();
      this.showSpinner = false;
      return;
    }

    // if there isn't a cached timestamp, get new data
    if (timestampString === null) {
      await this.getLibrariesByLocationData();
      this.showSpinner = false;
      return;
    }

    // if the timestamp is older than 1 hour, get new data
    const timestamp = new Date(JSON.parse(timestampString));

    if (new Date().getTime() - timestamp.getTime() > 3600000) {
      await this.getLibrariesByLocationData();
      this.showSpinner = false;
      return;
    }

    // if there isn't a cached latitude, get new data
    if (cachedLatitudeString === null) {
      await this.getLibrariesByLocationData();
      this.showSpinner = false;
      return;
    }

    // if there isn't a cached longitude, get new data
    if (cachedLongitudeString === null) {
      await this.getLibrariesByLocationData();
      this.showSpinner = false;
      return;
    }

    const cachedLatitude: number = parseFloat(cachedLatitudeString);
    const cachedLongitude: number = parseFloat(cachedLongitudeString);

    // if the location has changed by more than 2.5km, get new data
    const distance = this.locationService.distanceInKmBetweenEarthCoordinates(cachedLatitude, cachedLongitude, currentLatitude, currentLongitude);

    if (distance > 2.5) {
      await this.getLibrariesByLocationData();
      this.showSpinner = false;
      return;
    }


    const libraryResponse = JSON.parse(libraryResponseString) as LibraryResponse;

    if (!libraryResponse.success) {
      this.libraries = [];
      this.showSpinner = false;
    } else if (libraryResponse.libraries === undefined) {
      this.libraries = [];
      this.showSpinner = false;
    } else {
      this.libraries = libraryResponse.libraries;
      this.showSpinner = false;
    }

  }


  private initMap(): void {
    const map = L.map('map').setView([
      this.latitude,
      this.longitude
    ], 13); // Set view to your initial location

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const iconRetinaUrl = 'assets/images/marker-icon-2x.png';
    const iconUrl = 'assets/images/marker-icon.png';
    const shadowUrl = 'assets/images/marker-shadow.png';

    const iconDefault = L.icon({
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
      iconSize: [25, 41], // Size of the icon
      iconAnchor: [12, 41], // Point of the icon which will correspond to marker's location
      popupAnchor: [1, -34], // Point from which the popup should open relative to the iconAnchor
      shadowSize: [41, 41] // Size of the shadow
    });

    L.Marker.prototype.options.icon = iconDefault;

    // Plot each library location
    this.libraries.forEach(library => {
      const marker = L.marker([library.point.latitude, library.point.longitude]).addTo(map);
      marker.bindPopup(library.name);
      map.invalidateSize();
    });

    map.invalidateSize();
    this.showSpinner = false;
  }

  // private async makeRequest() {

  //   const { latitude, longitude } = await this.locationService.getLatitudeLongitude();

  //   // const coordinates = await Geolocation.getCurrentPosition();

  //   // const latitude = coordinates.coords.latitude;
  //   // const longitude = coordinates.coords.longitude;

  //   const target: string = `http://13.43.189.182/latitude/${latitude}/longitude/${longitude}/count/10`;

  //   // this.http.get(target).subscribe({
  //   //   next: (response) => {
  //   //     console.log(response);
  //   //     // Process your response here
  //   //   },
  //   //   error: (error) => {
  //   //     console.error('There was an error!', error);
  //   //     // Handle any errors here
  //   //   }
  //   // });

  //   const response = {
  //     "count": 10,
  //     "latitude": 53.196407,
  //     "libraries": [
  //       {
  //         "name": "Deeside Library",
  //         "point": {
  //           "latitude": 53.2079703,
  //           "longitude": -3.0274828
  //         }
  //       },
  //       {
  //         "name": "Broughton Library",
  //         "point": {
  //           "latitude": 53.1664886,
  //           "longitude": -2.9861782
  //         }
  //       },
  //       {
  //         "name": "Connah's Quay Library",
  //         "point": {
  //           "latitude": 53.2144368,
  //           "longitude": -3.0470163
  //         }
  //       },
  //       {
  //         "name": "Blacon Library",
  //         "point": {
  //           "latitude": 53.2084948,
  //           "longitude": -2.9270587
  //         }
  //       },
  //       {
  //         "name": "Buckley Library, Museum and Gallery",
  //         "point": {
  //           "latitude": 53.1673677,
  //           "longitude": -3.0795589
  //         }
  //       },
  //       {
  //         "name": "Lache Library",
  //         "point": {
  //           "latitude": 53.177564413,
  //           "longitude": -2.912584498
  //         }
  //       },
  //       {
  //         "name": "Buckley Town Council Offices and Library",
  //         "point": {
  //           "latitude": 53.168412,
  //           "longitude": -3.081728
  //         }
  //       },
  //       {
  //         "name": "Chester Library",
  //         "point": {
  //           "latitude": 53.192308555,
  //           "longitude": -2.892769364
  //         }
  //       },
  //       {
  //         "name": "Mynydd Isa Library",
  //         "point": {
  //           "latitude": 53.1689911,
  //           "longitude": -3.110264
  //         }
  //       },
  //       {
  //         "name": "Upton Library",
  //         "point": {
  //           "latitude": 53.2132041,
  //           "longitude": -2.884586
  //         }
  //       }
  //     ],
  //     "longitude": -3.0004506,
  //     "success": true
  //   };

  //   const map = L.map('map').setView([53.1963393, -3.000449], 13); // Set view to your initial location

  // }

  // private async success(position: any) {
  //   const coordinates = await Geolocation.getCurrentPosition();

  //   await this.makeRequest();

  //   // const latitude = coordinates.coords.latitude;
  //   // const longitude = coordinates.coords.longitude;

  //   // const target: string = `http://13.43.189.182/latitude/${latitude}/longitude/${longitude}/count/10`;

  //   // this.http.get(target).subscribe({
  //   //   next: (response) => {
  //   //     alert(JSON.stringify(response));
  //   //     // Process your response here
  //   //   },
  //   //   error: (error) => {
  //   //     console.error('There was an error!', error);
  //   //     // Handle any errors here
  //   //   }
  //   // });

  // }

  // private error(err: any) {
  //   alert(JSON.stringify(err));
  // }

}
