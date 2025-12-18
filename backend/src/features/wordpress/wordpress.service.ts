import { forwardRef, Inject, Injectable } from '@nestjs/common';
import WPAPI from 'wpapi';
import { MediaResponse } from './models/MediaResponse';
import { MediaAttachment } from './models/MediaAttachmentResponse';
import { FunctionResponse } from '../woocommerce/models/FunctionResponse';
import { ImageService } from '../image/image.service';

@Injectable()
export class WordpressService {
  private wp: WPAPI;
  constructor(
    @Inject(forwardRef(() => ImageService)) private imageService: ImageService,
  ) {
    //http://wp-api.org/node-wpapi/using-the-client/
    //https://developer.wordpress.org/rest-api/reference/media/
    this.wp = new WPAPI({
      endpoint: process.env.WORDPRESS_ENDPOINT || '',
      username: process.env.WORDPRESS_USERNAME || '',
      password: process.env.WORDPRESS_PASSWORD || '',
    });
    console.info('connect to wordpress:', {
      endpoint: process.env.WORDPRESS_ENDPOINT || '',
      username: process.env.WORDPRESS_USERNAME || '',
      password: process.env.WORDPRESS_PASSWORD || '',
    });
  }

  /**
   * Takes an url of an image and searches for it. If found, return the image. If not, fetch the image and uploads it
   * @param url url string of the source image
   * @param options filename, title, ...
   * @returns
   */
  async getImageOrConvertAndUpload(
    url: string,
    options: {
      fileName: string;
      title: string;
      alt_text: string;
      caption?: string;
    },
  ): Promise<FunctionResponse<MediaAttachment | undefined>> {
    const timeout = setTimeout(() => {
      console.error('Skipped due to timeout', url);
      return { errors: ['Skipped due to timeout', url] };
    }, 30 * 1000);
    try {
      const searchResult = await this.findPictureByStringInDescription(url);
      if (searchResult && searchResult.length > 0) {
        clearTimeout(timeout);
        return { data: searchResult[0] };
      }
      const loadedImage = await this.imageService.loadUrlImageAsBuffer(url);
      if (!loadedImage) {
        clearTimeout(timeout);
        return { errors: ['Could not load image ' + url] };
      }
      const compressedImage =
        await this.imageService.convertImageToWebPFromUrl(loadedImage);
      if (!compressedImage) {
        clearTimeout(timeout);
        return { errors: ['Could not convert image ' + url] };
      }
      const uploadedImage = await this.uploadImage(compressedImage, {
        ...options,
        description: url,
      });
      if (!uploadedImage) {
        clearTimeout(timeout);
        return { errors: ['Could not upload image ' + url] };
      }
      console.log('Success handling image', uploadedImage.link);
      clearTimeout(timeout);
      return { data: uploadedImage };
    } catch (e) {
      console.error(e);
    }
    clearTimeout(timeout);
    return { errors: ['undefined error while getting or uploading image'] };
  }

  async uploadImage(
    buffer: Buffer,
    options: {
      fileName: string;
      title?: string;
      alt_text?: string;
      caption?: string;
      description?: string;
    },
  ): Promise<MediaResponse | undefined> {
    //https://developer.wordpress.org/rest-api/reference/media/
    try {
      const response = (await this.wp
        .media()
        // @ts-expect-error file can be a buffer
        .file(buffer, options.fileName)
        .create({
          title: options.title || '',
          alt_text: options.alt_text || '',
          caption: options.caption || '',
          description: options.description || '',
        })) as unknown as Promise<MediaResponse>;
      return response;
    } catch (e) {
      console.error('Error uploading image to wordpress media', e);
    }
  }

  async findMedia(
    searchString: string,
  ): Promise<MediaAttachment[] | undefined> {
    try {
      const response = (await this.wp
        .media()
        .search(searchString)) as MediaAttachment[];
      return response;
    } catch (e) {
      console.error('Error uploading image to wordpress media', e);
    }
  }

  async findPictureByStringInDescription(
    search: string,
  ): Promise<MediaAttachment[] | undefined> {
    const allPictures = await this.findMedia(search);
    // console.log(allPictures);
    if (allPictures && allPictures.length > 0) {
      return allPictures
        .filter(
          (element) =>
            element.description &&
            JSON.stringify(element.description).includes(search),
        )
        .flat();
    }
  }
}
