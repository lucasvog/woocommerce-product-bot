import { forwardRef, Module } from '@nestjs/common';
import { WordpressService } from './wordpress.service';
import { WordpressController } from './wordpress.controller';
import { ImageModule } from '../image/image.module';

@Module({
  imports: [forwardRef(() => ImageModule)],
  controllers: [WordpressController],
  providers: [WordpressService],
  exports: [WordpressService],
})
export class WordpressModule {}
