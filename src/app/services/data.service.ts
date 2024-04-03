import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  private dbConnection: SQLiteDBConnection | undefined;
  private dbName: string = "bookDb";
  private sqlite: SQLiteConnection;


  constructor(private platform: Platform) {
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

  public async getConfig(name: string): Promise<any> {
    if (this.getPlatform() == 'web') {
      return await this.getConfigWeb(name);
    }

    const result = await this.getConfigSqlite(name);

    return result;
  }

  public async updateConfig(name: string, dataType: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value);

    if (this.getPlatform() == 'web') {
      return await this.updateConfigWeb(name, dataType, stringValue);
    }
    return await this.updateConfigSqlite(name, dataType, stringValue);
  }

  public async initDB() {
    if (this.getPlatform() === 'web') {
      await this.setUpIndexedDB();

      const languageExists = await this.languageConfigExistsWeb();
      if (!languageExists) {
        await this.setConfigWeb('language', 'string', 'en-GB');
      }
    } else {
      await this.setUpSQLite();

      const languageExists = await this.languageConfigExistsSqlite();
      if (!languageExists) {
        await this.setConfigSqlite('language', 'string', 'en-GB');
      }
    }
  }

  private getPlatform(): string {
    return this.platform.is('ios') || this.platform.is('android') ? 'mobile' : 'web';
  }

  private async setUpIndexedDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("Config")) {
          db.createObjectStore("Config", { keyPath: "Name" });
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

  private parseConfigValue(value: string, dataType: string): any {
    switch (dataType) {
      case 'string':
        // value is currently \"cy\" should be cy as a string but without the quotes and backslashes
        const jsonParsed = JSON.parse(value);
        // remove the quotes from start and end of the string
        return jsonParsed.substring(1, jsonParsed.length - 1);
      case 'integer':
        return parseInt(value, 10);
      case 'float':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
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

  private async setUpSQLite() {
    try {
      // Check if the SQLite DB exists, if not, create it
      const databasesList = await this.sqlite.getDatabaseList();
      const databaseValues = databasesList.values;

      let dbExists = false;

      if(databaseValues !== undefined){
        dbExists = databasesList.values?.includes(this.dbName) ? true : false;
      }else{
        dbExists = false;
      }

      if (!dbExists) {
        // Create the DB if it doesn't exist
        this.dbConnection = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
      } else {
        // Retrieve the existing DB connection
        this.dbConnection = await this.sqlite.retrieveConnection(this.dbName, false);
      }

      await this.dbConnection.open();

      // SQL statement to create the Config table if it doesn't exist
      const sqlCreateTable = `
        CREATE TABLE IF NOT EXISTS Config (
          Name TEXT PRIMARY KEY NOT NULL,
          Type TEXT NOT NULL,
          Value TEXT NOT NULL
        );
      `;

      // Execute the SQL statement to create the table
      await this.dbConnection.execute(sqlCreateTable);

      console.log('SQLite setup completed: Config table is ready.');
    } catch (error) {
      console.error('Error setting up SQLite DB:', error);
    }
  }

  private languageConfigExistsSqlite(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
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

  private setConfigSqlite(name: string, dataType: string, value: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
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

  private getConfigSqlite(name: string): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const sqlSelect = "SELECT * FROM Config WHERE Name = ?;";
        const result = await this.dbConnection?.query(sqlSelect, [name]);

        if(!result?.values || !result.values){
          reject('No values found');
          return;
        }

        if (result.values.length === 0) {
          reject(`Config item '${name}' not found`);
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

  private updateConfigSqlite(name: string, dataType: string, value: any): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
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
