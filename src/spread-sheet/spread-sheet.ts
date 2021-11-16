/**
 * spread-sheet.ts
 * Copyright (C) 2020 Editora Sanar
 *
 * Distributed under terms of the MIT license.
 * @author Edgard Leal <edgard.leal@sanar.com>
 * @module spread-sheet.ts
 */
import debug from 'debug';
import * as lib from 'sqlite3';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { totalForLastDay } from './db/index';
import { splitDate, ISplitedDate } from './date';

const cred = require(process.env.SPREADSHEET_AUTH_FILE!); // eslint-disable-line

const logger = debug('keystats:spreadsheet');

export default class SheetSync {
  private lastDay: number = 0;

  private id: string;

  private sheetNumber: number;

  private isAuthenticated = false;

  private doc: GoogleSpreadsheet;

  private sheet: GoogleSpreadsheetWorksheet;

  constructor(
    id: string,
    sheet: number = 0,
  ) {
    this.id = id;
    this.sheetNumber = sheet;
    this.doc = new GoogleSpreadsheet(id);
  }

  async auth(): Promise<any> {
    if (this.isAuthenticated) {
      return Promise.resolve(this.doc);
    }
    logger('Authenticating...');
    await this.doc.useServiceAccountAuth(cred);
    await this.doc.loadInfo();
    logger(`Doc: ${this.doc.title}`);
    this.sheet = this.doc.sheetsByIndex[this.sheetNumber];
    logger(`Sheet: ${this.sheet.title}`);
    logger(`Rowns: ${this.sheet.rowCount}`);
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
    } while (list.length && list[list.length - 1][fieldNameToValidate]);
    return result;
  }

  /**
   * Check if the row already exists on sheet.
   *
   */
  async exists({ year, month, day }: ISplitedDate): Promise<boolean> {
    let offset = 0;
    let rows = [];
    const searchFunction = (row: any) => row.Year === `${year}`
      && row.Month === `${month}` && row.Day === `${day}`;

    do {
      rows = await this.getRows(offset);
      const finded = rows.find(searchFunction);
      if (finded) {
        return true;
      }
      offset += rows.length;
    } while (rows.length && rows[0].Year);
    return false;
  }

  async check(db: lib.Database): Promise<void> {
    const today = new Date().getDate();
    if (this.lastDay === today) {
      return Promise.resolve();
    }
    await this.auth();

    const splitedDate = splitDate();
    if ((await this.exists(splitedDate))) {
      logger('Last day keys is already on spreadsheet');
      return Promise.resolve();
    }
    const {
      year,
      month,
      day,
    } = splitedDate;
    const total = await totalForLastDay(db);
    logger('Registering %d keys on spreadsheet...', total);
    const result = await this.sheet.addRows([
      {
        Date: new Date().toISOString(),
        Total: total || 0,
        Year: year,
        Month: month,
        Day: day - 1,
      } as any,
    ]);
    logger('Data sent to spreadseet: %o', result);
    this.lastDay = today;
    return Promise.resolve();
  }
}
