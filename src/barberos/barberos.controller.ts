import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BarberosService } from './barberos.service';
import { CreateBarberoDto } from './dto/create-barbero.dto';
import { UpdateBarberoDto } from './dto/update-barbero.dto';

@Controller('barberos')
export class BarberosController {
  constructor(private readonly barberosService: BarberosService) {}

  @Post()
  create(@Body() createBarberoDto: CreateBarberoDto) {
    return this.barberosService.create(createBarberoDto);
  }

  @Get()
  findAll() {
    return this.barberosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.barberosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBarberoDto: UpdateBarberoDto) {
    return this.barberosService.update(+id, updateBarberoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.barberosService.remove(+id);
  }
}

