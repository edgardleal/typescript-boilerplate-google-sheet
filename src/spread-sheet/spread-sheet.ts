/**
 * spread-sheet.ts
 * Copyright (C) 2020 Editora Sanar
 *
 * Distributed under terms of the MIT license.
 * @author Edgard Leal <edgard.leal@sanar.com>
 * @module spread-sheet.ts
 */
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet, GoogleSpreadsheetRow } from 'google-spreadsheet';

const cred = require(process.env.SPREADSHEET_AUTH_FILE!); // eslint-disable-line

export default class SheetSync<T = any> {
  private cache: GoogleSpreadsheetRow[] = [];

  private id: string;

  private sheetNumber: number;

  private isAuthenticated = false;

  private doc: GoogleSpreadsheet;

  private sheet: GoogleSpreadsheetWorksheet;

  private currentKey: string;

  get spreadSheetId(): string {
    return this.id;
  }

  get primaryKey(): string {
    return this.currentKey;
  }

  constructor(
    id: string,
    primaryKey: string = '',
    sheet: number = 0,
  ) {
    this.currentKey = primaryKey;
    this.id = id;
    this.sheetNumber = sheet;
    this.doc = new GoogleSpreadsheet(this.id);
  }

  async auth(): Promise<any> {
    if (this.isAuthenticated) {
      return Promise.resolve(this.doc);
    }
    await this.doc.useServiceAccountAuth(cred);
    await this.doc.loadInfo();
    this.sheet = this.doc.sheetsByIndex[this.sheetNumber];
    this.isAuthenticated = true;
    return this.doc;
  }

  /**
   * Return a bunch of 30 rows
   */
  async getRows(offset: number = 0): Promise<GoogleSpreadsheetRow[]> {
    await this.auth();
    return this.sheet.getRows({
      offset,
      limit: 30,
    });
  }

  /**
   * Get all rows from current sheet.
   * the `fieldNameToValidate` will be used to check if
   * a row is not empty, if the row is empty, the lines bellow
   * will not be used.
   */
  async getAllRows(fieldNameToValidate: string): Promise<GoogleSpreadsheetRow[]> {
    if (this.cache && this.cache.length) {
      console.log('Returning cached result...', ); // eslint-disable-line
      return this.cache;
    }
    const result: any[] = [];

    let list: any[] = [];
    let skip = 0;
    do {
      list = await this.getRows(skip);
      for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (!item[fieldNameToValidate]) {
          return result;
        }
        result.push(item);
      }

      skip += list.length;
      console.log('Quering next page: %d', skip); // eslint-disable-line
    } while (list.length && list[list.length - 1][fieldNameToValidate]);
    this.cache = result;
    return result;
  }

  async getRownByKey(keyValue: string, colunmName: string = ''): Promise<GoogleSpreadsheetRow | null> {
    return (await this.getAllRows(colunmName))
      .find((row: GoogleSpreadsheetRow) => row && row[colunmName] === keyValue) || null;
  }

  async exists(keyValue: string, colunmName: string): Promise<boolean> {
    return !!(await this.getRownByKey(keyValue, colunmName));
  }
}
