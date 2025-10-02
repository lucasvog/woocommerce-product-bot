import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as Papa from 'papaparse';

@Injectable()
export class ImporterService {
  constructor() {
    // void this.getCsvWithHeader('http://csv.battlemerchant.com/Produktinfo.csv');
  }
  async getCsvWithHeader<TKeys extends string>(
    url: string,
    options?: { csvParseOptions: Papa.ParseConfig },
  ): Promise<Record<TKeys, string>[] | undefined> {
    const result = await this._getCsvString(url);
    if (result) {
      try {
        const parsedData = Papa.parse<Record<string, string>>(result, {
          ...options?.csvParseOptions,
          header: true,
        });
        console.log(parsedData.data);
        return parsedData.data;
      } catch (e) {
        console.error(e);
        return;
      }
    }
  }
  private async _getCsvString(url: string): Promise<string | undefined> {
    try {
      const response = await axios.get<string>(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return;
    }
  }
}
