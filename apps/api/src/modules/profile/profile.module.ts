import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import { UploadModule } from '../../common/upload/upload.module';

@Module({
  imports: [AuthModule, UploadModule],
  controllers: [ProfileController],
  providers: [ProfileRepository, ProfileService],
})
export class ProfileModule {}
