import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import * as fs from 'fs';
import { WordpressService } from '../wordpress/wordpress.service';
@Injectable()
export class ImageService {
  constructor(private wordpressService: WordpressService) {
    // this.test();
  }

  async test() {
    // const image = await this.loadUrlImageAsBuffer(
    //   'https://www.battlemerchant.com/media/image/1c/fb/3e/ulf-sd-13_ulfberth_buckel_schildbuckel_shield_boss_mittelalterXX7ZSuZ5aOFcH_600x600.jpg',
    // );
    // const webp = await this.convertImageToWebPFromUrl(image);
    // console.log('WRITING TEST IMAGE');
    // fs.writeFileSync('./test.webp', webp);
    // await this.wordpressService.uploadImage(webp, {
    //   fileName:
    //     '0101002722_schwert_us_kavalleriesaebel_modell_1860_schw_griff.webp',
    //   description:
    //     'http://img.battlemerchant.de/products_images/0101002722_schwert_us_kavalleriesaebel_modell_1860_schw_griff.jpg',
    // });
    // console.log('FINDING PICTURE');
    // const searchResult =
    //   await this.wordpressService.findPictureByStringInDescription(
    //     'http://img.battlemerchant.de/products_images/0101002722_schwert_us_kavalleriesaebel_modell_1860_schw_griff.jpg',
    //   );
    // console.log(searchResult);
  }

  getWebpFileNameFromUrl(url: string) {
    const urlParts = url.split('/');
    const originalFileName = urlParts[urlParts.length - 1];
    const fileNameWithoutExtension = originalFileName
      .split('.')
      .slice(0, -1)
      .join('.');
    return fileNameWithoutExtension + '.webp';
  }

  async loadUrlImageAsBuffer(url: string): Promise<Buffer | undefined> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.error('Error loading image from URL:', err);
      return;
      // throw new InternalServerErrorException('Failed to load image');
    }
  }

  async convertImageToWebPFromUrl(data: Buffer): Promise<Buffer> {
    try {
      // Dynamic imports to handle ESM modules with typing
      const imageminModule = (await import(
        'imagemin'
      )) as unknown as typeof import('imagemin');
      const imageminWebpModule = (await import(
        'imagemin-webp'
      )) as unknown as typeof import('imagemin-webp');
      const imagemin = imageminModule.default;
      const imageminWebp = imageminWebpModule.default;

      const result = await imagemin.buffer(data, {
        plugins: [imageminWebp({ quality: 50 })],
      });
      return Buffer.from(result);
    } catch (err) {
      console.error('Error converting image to WebP:', err);
      throw new InternalServerErrorException('Failed to convert image');
    }
  }
}
