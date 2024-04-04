import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Platform } from '@ionic/angular';
import { Point } from '../interfaces/libraryResponse';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor(private platform: Platform) { }

  public getLatitudeLongitude(): Promise<any> {
    return this.getPlatform() === 'web' ? this.getLatLongFromWeb() : this.getLatLongFromMobile();
  }

  public distanceInKmBetweenEarthCoordinates(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;

    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const lat1Rad = this.degreesToRadians(lat1);
    const lat2Rad = this.degreesToRadians(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  private getLatLongFromWeb(): Promise<any> {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        const options = {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 0
        };
        navigator.geolocation.getCurrentPosition((position) => {
          resolve(this.success(position));
        }, (err) => {
          reject(this.error(err));
        }, options);
      } else {
        reject('Geolocation is not supported by this browser.');
      }
    });
  }

  private async getLatLongFromMobile(): Promise<any> {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const latitude = coordinates.coords.latitude;
      const longitude = coordinates.coords.longitude;
      alert(JSON.stringify([latitude, longitude]))
      return { latitude, longitude };
    } catch (err: any) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
      throw err; // Rethrow after logging to allow caller to handle.
    }
  }

  private success(position: any) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    return { latitude, longitude };
  }

  private error(err: any) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    // This could be modified to throw an error if you want the caller to handle it
    throw new Error(`ERROR(${err.code}): ${err.message}`);
  }

  private getPlatform(): string {
    return this.platform.is('ios') || this.platform.is('android') ? 'mobile' : 'web';
  }
}
