import { forwardRef, Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { WordpressModule } from '../wordpress/wordpress.module';

@Module({
  imports: [forwardRef(() => WordpressModule)],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
