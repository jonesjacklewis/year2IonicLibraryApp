import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BooksService {

  constructor() { }

  public async verifyIsbn(isbn: string){
    if(
      isbn.length < 10 ||
      isbn.length > 13
    ){
      return false;
    }
    
    if(isbn.length == 10){
      return this.verifyIsbn10(isbn);
    }

    return this.verifyIsbn13(isbn);
  }

  private async verifyIsbn10(isbn: string){
    const isbnArray = isbn.split('');
    let checkSum: number | string = 0;

    for(let i = 0; i < 9; i++){
      checkSum += parseInt(isbnArray[i]) * (i + 1);
    }

    checkSum = checkSum % 11;

    if(checkSum == 10){
      checkSum = 'X';
    }

    return checkSum == isbnArray[9];
  }

  private async verifyIsbn13(isbn: string){
    const isbnArray = isbn.split('');
    let checkSum: number = 0;

    for(let i = 0; i < 12; i++){
      checkSum += parseInt(isbnArray[i]) * (i % 2 == 0 ? 1 : 3);
    }

    checkSum = 10 - (checkSum % 10);

    if(checkSum == 10){
      checkSum = 0;
    }

    return `${checkSum}` == isbnArray[12];
  }
}
