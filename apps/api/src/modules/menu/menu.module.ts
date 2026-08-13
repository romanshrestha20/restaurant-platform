import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime';
import { UploadModule } from '../../common/upload/upload.module';
import { MenuController } from './menu.controller';
import { MenuRepository } from './menu.repository';
import { MenuService } from './menu.service';

@Module({
  imports: [AuthModule, RealtimeModule, UploadModule],
  controllers: [MenuController],
  providers: [MenuRepository, MenuService],
})
export class MenuModule {}
