import { Module } from '@nestjs/common';
import { GateGateway } from './gate.gateway';

@Module({
  providers: [GateGateway],
  exports: [GateGateway],
})
export class RealtimeModule {}
