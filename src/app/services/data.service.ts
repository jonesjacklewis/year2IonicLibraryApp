import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Book } from '../interfaces/book';
import { interval, take, lastValueFrom } from 'rxjs';

import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private dbConnection: SQLiteDBConnection | undefined;
  private dbName: string = "bookDb";
  private sqlite: SQLiteConnection;


  constructor(private platform: Platform, private http: HttpClient) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.platform.ready().then(() => {
      return;
    });
    
  }

  public async setConfig(name: string, dataType: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value);

    if (this.getPlatform() == 'web') {
      return await this.setConfigWeb(name, dataType, stringValue);
    }
    return await this.setConfigSqlite(name, dataType, stringValue);
  }

  public async addBook(book: Book): Promise<void> {
    if (this.getPlatform() == 'web') {
      return await this.addBookWeb(book);
    }
    return await this.addBookSqlite(book);
  }

  public async setLocalStorage(name: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value);


    if (this.getPlatform() == 'web') {
      return await this.setLocalStorageWeb(name, stringValue);
    }
    return await this.setLocalStorageSqlite(name, stringValue);
  }

  public async getConfig(name: string): Promise<any> {
    if (this.getPlatform() == 'web') {
      return await this.getConfigWeb(name);
    }

    const result = await this.getConfigSqlite(name);

    return result;
  }

  public async getLocalStorage(name: string): Promise<any> {
    if (this.getPlatform() == 'web') {
      return await this.getLocalStorageWeb(name);
    }
    
    const result = await this.getLocalStorageSqlite(name);

    return result;
  }

  public async updateConfig(name: string, dataType: string, value: any): Promise<void> {

    let stringValue: string = "";
    if(dataType !== 'string'){
      stringValue = JSON.stringify(value);
    }else{
      stringValue = value;
    }
    if (this.getPlatform() == 'web') {
      return await this.updateConfigWeb(name, dataType, stringValue);
    }
    return await this.updateConfigSqlite(name, dataType, stringValue);
  }

  public async getAllBooks(): Promise<Book[]> {
    if (this.getPlatform() == 'web') {
      return await this.getAllBooksWeb();
    }
    return await this.getAllBooksSqlite();
  }

  private async getAllBooksSqlite(): Promise<Book[]> {
    return new Promise<Book[]>(async (resolve, reject) => {
      try {
        if(!this.dbConnection && this.getPlatform() === 'android'){
          await this.setUpSQLite();
        }
        const sqlSelect = "SELECT * FROM Books;";
        const result = await this.dbConnection?.query(sqlSelect);

        if(!result?.values || !result.values){
          resolve([]);
          return;
        }

        const books: Book[] = result.values.map((book: any) => {

          const isbn = book['isbn'];
          const title = book['title'];
          const author = book['author'];

          let pageCount = book['pageCount'];
          // make sure pageCount is a number
          if (typeof pageCount === 'string') {
            pageCount = parseInt(pageCount, 10);
          }

          let publishedDate = book['publishedDate'];
          // make sure publishedDate is a Date object
          if (typeof publishedDate === 'string') {
            publishedDate = new Date(publishedDate);
          }

          const imageUrl = book['imageUrl'];

          const bookItem: Book = {
            isbn,
            title,
            author,
            pageCount,
            publishedDate,
            imageUrl
          };
          return bookItem;
      });

        resolve(books);
      } catch (error) {
        alert(JSON.stringify(error));
        console.error('Error getting all books:', error);
        reject(error);
      }
    });

  }

  private async getAllBooksWeb(): Promise<Book[]> {
    return new Promise<Book[]>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["Books"], "readonly");
        const objectStore = transaction.objectStore("Books");
        const getRequest = objectStore.getAll();

        const books: Book[] = [];



        getRequest.onsuccess = () => {
          for (const book of getRequest.result) {
            books.push({
              isbn: book.isbn,
              title: book.title,
              author: book.author,
              pageCount: book.pageCount,
              publishedDate: book.publishedDate,
              imageUrl: book.imageUrl
            });
          }

          resolve(books);
        };

        getRequest.onerror = () => {
          resolve([]);
        };
      };

      request.onerror = () => {
        reject([]);
      };
    });
  }

  private async setDefaultBooksWeb(): Promise<void> {
    // read file from assets folder named defaultBookData.json
    
    const data = (await lastValueFrom(this.http.get('assets/defaultBookData.json'))) as Book[];

    for (const book of data) {
      try{
        await this.addOfflineBookWeb(book);
      }catch{
        continue;
      }
    }

  }


 

  



  public async initDB() {
    if (this.getPlatform() === 'web') {
      await this.setUpIndexedDB();

      const languageExists = await this.languageConfigExistsWeb();
      if (!languageExists) {
        await this.setConfigWeb('language', 'string', 'en-GB');
        await this.setConfigWeb('tts', 'boolean', 'false');
        await this.setDefaultBooksWeb();
      }
    } else {
      await this.setUpSQLite();

      const languageExists = await this.languageConfigExistsSqlite();
      if (!languageExists) {
        await this.setConfigSqlite('language', 'string', 'en-GB');
        await this.setConfigSqlite('tts', 'boolean', 'false');
      }
    }
  }

  private getPlatform(): string {

    if(this.platform.is('ios')){
      return 'ios';
    }

    if(this.platform.is('android')){
      return 'android';
    }

    return 'web';

    // return this.platform.is('ios') || this.platform.is('android') ? 'mobile' : 'web';
  }

  private async setUpIndexedDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("Config")) {
          db.createObjectStore("Config", { keyPath: "Name" });
        }
        if (!db.objectStoreNames.contains("LocalStorage")) {
          db.createObjectStore("LocalStorage", { keyPath: "Name" });
        }
        if (!db.objectStoreNames.contains("OfflineBooks")) {
          const bookStore = db.createObjectStore("OfflineBooks", { keyPath: "id", autoIncrement: true });
          // Creating indexes for other properties to enable querying
          bookStore.createIndex("isbn", "isbn", { unique: false });
          bookStore.createIndex("title", "title", { unique: false });
          bookStore.createIndex("author", "author", { unique: false });
          bookStore.createIndex("publishedDate", "publishedDate", { unique: false });
          bookStore.createIndex("pageCount", "pageCount", { unique: false });
          bookStore.createIndex("imageUrl", "imageUrl", { unique: false });
          // No index for pageCount or image as would not be used for querying
        }

        if (!db.objectStoreNames.contains("Books")) {
          const bookStore = db.createObjectStore("Books", { keyPath: "id", autoIncrement: true });
          // Creating indexes for other properties to enable querying
          bookStore.createIndex("isbn", "isbn", { unique: false });
          bookStore.createIndex("title", "title", { unique: false });
          bookStore.createIndex("author", "author", { unique: false });
          bookStore.createIndex("publishedDate", "publishedDate", { unique: false });
          bookStore.createIndex("pageCount", "pageCount", { unique: false });
          bookStore.createIndex("imageUrl", "imageUrl", { unique: false });
          // No index for pageCount or image as would not be used for querying
        }
        
        resolve(); // Resolve the promise as the upgrade is the setup process
      };

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async addOfflineBookWeb(book: Book): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["OfflineBooks"], "readwrite");
        const objectStore = transaction.objectStore("OfflineBooks");

        const bookItem = {
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          pageCount: book.pageCount,
          publishedDate: book.publishedDate,
          imageUrl: book.imageUrl
        };
        const putRequest = objectStore.put(bookItem); // `put` either adds a new entry or updates an existing one

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          console.error("Error saving book:", putRequest.error);
          resolve();
        };
      };

      request.onerror = () => {
        resolve();
      };
    });
  }

  private async addBookWeb(book: Book): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["Books"], "readwrite");
        const objectStore = transaction.objectStore("Books");

        const bookItem = {
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          pageCount: book.pageCount,
          publishedDate: book.publishedDate,
          imageUrl: book.imageUrl
        };
        const putRequest = objectStore.put(bookItem); // `put` either adds a new entry or updates an existing one

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          console.error("Error saving book:", putRequest.error);
          resolve();
        };
      };

      request.onerror = () => {
        resolve();
      };
    });
  }
 

  private async languageConfigExistsWeb(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["Config"], "readonly");
        const objectStore = transaction.objectStore("Config");
        const getRequest = objectStore.get("language");

        getRequest.onsuccess = () => {
          resolve(!!getRequest.result); // true if exists, false otherwise
        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async setConfigWeb(name: string, dataType: string, value: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["Config"], "readwrite");
        const objectStore = transaction.objectStore("Config");

        const configItem = { Name: name, Type: dataType, Value: value };
        const putRequest = objectStore.put(configItem); // `put` either adds a new entry or updates an existing one

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          console.error("Error saving configuration item:", putRequest.error);
          reject(putRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async setLocalStorageWeb(name: string, value: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["LocalStorage"], "readwrite");
        const objectStore = transaction.objectStore("LocalStorage");

        const storageItem = { Name: name, Value: value };
        const putRequest = objectStore.put(storageItem); // `put` either adds a new entry or updates an existing one

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          console.error("Error saving local storage item:", putRequest.error);
          reject(putRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private parseConfigValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'string':
       if(value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        return value.trim();
      case 'integer':
        return parseInt(value, 10);
      case 'float':
        return parseFloat(value);
      case 'boolean':
        return value.toLocaleLowerCase().includes('true');
      default:
        return value;
    }
  }

  private async getLocalStorageWeb(name: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["LocalStorage"], "readonly");
        const objectStore = transaction.objectStore("LocalStorage");
        const getRequest = objectStore.get(name);

        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            // reject(`Local Storage item '${name}' not found`);
            resolve(null);
          }

          const localStorageItem = getRequest.result;
          resolve(localStorageItem ? localStorageItem.Value : null);

        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async getConfigWeb(name: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["Config"], "readonly");
        const objectStore = transaction.objectStore("Config");
        const getRequest = objectStore.get(name);

        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            reject(`Config item '${name}' not found`);
            return;
          }

          const configItem = getRequest.result;
          const parsedValue = this.parseConfigValue(configItem.Value, configItem.Type);
          resolve(parsedValue);
        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async updateConfigWeb(name: string, dataType: string, value: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["Config"], "readwrite");
        const objectStore = transaction.objectStore("Config");

        const configItem = { Name: name, Type: dataType, Value: JSON.stringify(value) };
        const putRequest = objectStore.put(configItem);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          console.error("Error updating configuration item:", putRequest.error);
          reject(putRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async addBookSqliteOld(book: Book): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if(!this.dbConnection && this.getPlatform() === 'android'){
        await this.setUpSQLite();
      }
      try {
        const sqlInsert = `
          INSERT INTO Books (isbn, title, author, pageCount, publishedDate, imageUrl)
          VALUES (?, ?, ?, ?, ?, ?);
        `;

        const query = this.dbConnection?.query(sqlInsert, [book.isbn, book.title, book.author, book.pageCount, book.publishedDate, book.imageUrl])

        if(!query){
          reject('Query is undefined');
          return;
        }

        await query;

        resolve();
      } catch (error) {
        console.error('Error adding book:', error);
        reject(error);
      }
    });
  }

  private async setUpSQLite() {
    try {

      if(!this.dbConnection){
        try{
          this.dbConnection = await this.sqlite.retrieveConnection(this.dbName, false);
        }catch{
          this.dbConnection = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
        }
      }
      
      
      await this.dbConnection.open();
      
      // await this.dbConnection.open();

      // SQL statement to create the Config table if it doesn't exist
      const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS Config (
          Name TEXT PRIMARY KEY NOT NULL,
          Type TEXT NOT NULL,
          Value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS LocalStorage (
          Name TEXT PRIMARY KEY NOT NULL,
          Value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS OfflineBooks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          isbn TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          pageCount INTEGER NOT NULL,
          publishedDate TEXT NOT NULL,
          imageUrl TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          isbn TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          pageCount INTEGER NOT NULL,
          publishedDate TEXT NOT NULL,
          imageUrl TEXT NOT NULL
        );
      `;

      // Execute the SQL statement to create the table
      await this.dbConnection.execute(sqlCreateTable);

      console.log('SQLite setup completed: Config table is ready.');
    } catch (error) {
      console.error('Error setting up SQLite DB:', error);
      alert(JSON.stringify(error));
    }
  }

  private languageConfigExistsSqlite(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if(!this.dbConnection && this.getPlatform() === 'android'){
          await this.setUpSQLite();
        }
        const sqlSelect = "SELECT * FROM Config WHERE Name = 'language';";
        const result = await this.dbConnection?.query(sqlSelect);

        if(!result?.values || !result.values){
          resolve(false);
          return;
        }

        resolve(result.values.length > 0);
      } catch (error) {
        console.error('Error checking if language config exists:', error);
        reject(error);
      }
    });
  }

  private addBookSqlite(book: Book): Promise<void> {
    alert('addBookSqlite');
    return new Promise<void>(async (resolve, reject) => {
      alert(`this.dbConnection: ${this.dbConnection}`);
      alert(`this.getPlatform(): ${this.getPlatform()}`);

      if(!this.dbConnection && this.getPlatform() === 'android'){
        alert('setUpSQLite');
        await this.setUpSQLite();
      }

      /*

      CREATE TABLE IF NOT EXISTS Books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          isbn TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT NOT NULL,
          pageCount INTEGER NOT NULL,
          publishedDate TEXT NOT NULL,
          imageUrl TEXT NOT NULL
        );
        */

      try {
        alert('try');
        const sqlInsert = `
          INSERT INTO Books
          (isbn, title, author, pageCount, publishedDate, imageUrl)
          VALUES (?, ?, ?, ?, ?, ?);
        `;

        alert(`sqlInsert: ${sqlInsert}`);

        const query = this.dbConnection?.query(sqlInsert, [
          book.isbn,
          book.title,
          book.author,
          book.pageCount,
          book.publishedDate,
          book.imageUrl
        ]);
        
        alert(`query: ${query}`);

        if(!query){
          reject('Query is undefined');
          return;
        }

        await query;

        resolve();
      } catch (error) {
        alert(JSON.stringify(error));
        console.error('Error adding book:', error);
        reject(error);
      }
    });
  }


  private setConfigSqlite(name: string, dataType: string, value: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if(!this.dbConnection && this.getPlatform() === 'android'){
        await this.setUpSQLite();
      }
      try {
        const sqlInsert = `
          INSERT INTO Config (Name, Type, Value)
          VALUES (?, ?, ?)
          ON CONFLICT(Name) DO UPDATE SET Value = '${value}';
        `;

        const query = this.dbConnection?.query(sqlInsert, [name, dataType, value])

        if(!query){
          reject('Query is undefined');
          return;
        }

        await query;

        resolve();
      } catch (error) {
        console.error('Error setting language config:', error);
        reject(error);
      }
    });
  }

  private setLocalStorageSqlite(name: string, value: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if(!this.dbConnection && this.getPlatform() === 'android'){
        await this.setUpSQLite();
      }
      try {
        const sqlInsert = `
        INSERT OR REPLACE INTO LocalStorage (Name, Value) VALUES (?, ?);
        `;

        const query = this.dbConnection?.query(sqlInsert, [name, value])

        if(!query){
          reject('Query is undefined');
          return;
        }

        await query;

        resolve();
      } catch (error) {
        alert(JSON.stringify(error));
        console.error('Error setting local storage:', error);
        reject(error);
      }
    });
  }

  private getConfigSqlite(name: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if(!this.dbConnection && this.getPlatform() === 'android'){
          await this.setUpSQLite();
        }
        const sqlSelect = "SELECT * FROM Config WHERE Name = ?;";
        const result = await this.dbConnection?.query(sqlSelect, [name]);

        if(!result?.values || !result.values){
          // reject('No values found');
          resolve(null);
          return;
        }

        if (result.values.length === 0) {
          // reject(`Config item '${name}' not found`);
          resolve(null);
          return;
        }

        const configItem = result.values[0];
        const parsedValue = this.parseConfigValue(configItem.Value, configItem.Type);

        resolve(parsedValue);
      } catch (error) {
        console.error('Error getting language config:', error);
        reject(error);
      }
    });
  }

  private getLocalStorageSqlite(name: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        if(!this.dbConnection && this.getPlatform() === 'android'){
          await this.setUpSQLite();
        }
        if(!this.dbConnection && this.getPlatform() === 'android'){
          await this.setUpSQLite();
        }
        const sqlSelect = "SELECT * FROM LocalStorage WHERE Name = ?;";
        const result = await this.dbConnection?.query(sqlSelect, [name]);

        if(!result?.values || !result.values){
          resolve(null);
          return;
        }

        if (result.values.length === 0) {
          resolve(null);
          return;
        }

        const localStorageItem = result.values[0];
        resolve(localStorageItem.Value);
      } catch (error) {
        alert(JSON.stringify(error));
        resolve(null);
      }
    });
  }

  private updateConfigSqlite(name: string, dataType: string, value: any): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if(!this.dbConnection && this.getPlatform() === 'android'){
          await this.setUpSQLite();
        }
        const sqlUpdate = `
          UPDATE Config
          SET Value = ?
          WHERE Name = ?;
        `;

        const query = this.dbConnection?.query(sqlUpdate, [JSON.stringify(value), name]);

        if(!query){
          reject('Query is undefined');
          return;
        }

        await query;

        resolve();
      } catch (error) {
        console.error('Error updating language config:', error);
        reject(error);
      }
    });
  }

}
