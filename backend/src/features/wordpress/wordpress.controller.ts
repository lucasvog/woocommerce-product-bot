import { Controller } from '@nestjs/common';
import { WordpressService } from './wordpress.service';

@Controller('wordpress')
export class WordpressController {
  constructor(private readonly wordpressService: WordpressService) {}
}
