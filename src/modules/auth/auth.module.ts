import { Module } from '@nestjs/common';
import { AuthModule as NestjsAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '../../lib/auth';
import { AuthHooks } from './auth.service';

@Module({
  imports: [
    NestjsAuthModule.forRoot({ auth, disableControllers: true }),
  ],
  providers: [AuthHooks],
})
export class AuthModule {}
