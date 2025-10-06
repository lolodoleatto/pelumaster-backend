import { PartialType } from '@nestjs/mapped-types';
import { CreateBarberoDto } from './create-barbero.dto';

export class UpdateBarberoDto extends PartialType(CreateBarberoDto) {}