import { forwardRef, Module } from '@nestjs/common';
import { ImporterService } from './importer.service';
import { ImporterController } from './importer.controller';
import { WordpressModule } from '../wordpress/wordpress.module';

@Module({
  imports: [forwardRef(() => WordpressModule)],
  controllers: [ImporterController],
  providers: [ImporterService],
  exports: [ImporterService],
})
export class ImporterModule {}
