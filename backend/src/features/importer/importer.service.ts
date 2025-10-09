import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Papa from 'papaparse';
import * as fs from 'fs';

@Injectable()
export class ImporterService {
  constructor() {
    // void this.getCsvWithHeader('http://csv.battlemerchant.com/Produktinfo.csv');
  }
  async getCsvWithHeader<TKeys extends string>(
    url: string,
    options?: { csvParseOptions?: Papa.ParseConfig; isLocal?: boolean },
  ): Promise<Record<TKeys, string>[] | undefined> {
    let result: string | undefined = '';
    if (options && options.isLocal) {
      result = this._getCsvStringLocal(url);
    } else {
      result = await this._getCsvStringOnline(url);
    }
    if (result) {
      try {
        const parsedData = Papa.parse<Record<string, string>>(result, {
          ...(options?.csvParseOptions ? options?.csvParseOptions : {}),
          header: true,
        });
        // console.log(parsedData.data);
        console.log('Parsed data with length', parsedData.data.length);
        return parsedData.data;
      } catch (e) {
        console.error(e);
        return;
      }
    }
  }
  private async _getCsvStringOnline(url: string): Promise<string | undefined> {
    try {
      const response = await axios.get<string>(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  private _getCsvStringLocal(localPath: string): string | undefined {
    if (!fs.existsSync(localPath)) {
      console.error('Path does not exist');
      return;
    }
    try {
      return fs.readFileSync(localPath, { encoding: 'utf-8' });
    } catch (e) {
      console.error('Could not read local file', e);
    }
  }
}
