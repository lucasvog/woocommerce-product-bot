import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImageModule } from './features/image/image.module';
import { WordpressModule } from './features/wordpress/wordpress.module';
import { ImporterModule } from './features/importer/importer.module';
import { WoocommerceModule } from './features/woocommerce/woocommerce.module';
import { AiModule } from './features/ai/ai.module';

@Module({
  imports: [
    forwardRef(() => ImageModule),
    forwardRef(() => WordpressModule),
    forwardRef(() => ImporterModule),
    forwardRef(() => WoocommerceModule),
    forwardRef(() => AiModule),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
