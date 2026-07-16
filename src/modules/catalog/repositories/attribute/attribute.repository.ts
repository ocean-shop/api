import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../../entities/attribute.entity';

@Injectable()
export class AttributeRepository {
  constructor(
    @InjectRepository(Attribute)
    private readonly repository: Repository<Attribute>,
  ) {}

  async findById(id: string): Promise<Attribute> {
    const attribute = await this.repository.findOne({ where: { id } });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return attribute;
  }

  async findAll(): Promise<Attribute[]> {
    return this.repository.find();
  }

  create(payload: Partial<Attribute>): Attribute {
    return this.repository.create(payload);
  }

  async save(attribute: Attribute): Promise<Attribute> {
    return this.repository.save(attribute);
  }

  async remove(attribute: Attribute): Promise<Attribute> {
    return this.repository.remove(attribute);
  }
}
