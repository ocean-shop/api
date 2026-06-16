---
name: nestjs-backend
description: Authors and reviews NestJS backend code following standard architecture, thin controllers, rich services, DTOs with class-validator, dependency injection, and standard error handling. Use ONLY when the user explicitly requests this skill.
disable-model-invocation: true
---

# NestJS Backend

This skill encodes the NestJS backend conventions used in the `server` project of this Nx workspace.

## Hard Rules

1. **Architecture.** Follow the standard NestJS architecture: Controllers -> Services -> Repositories/Data Access.
2. **Thin Controllers.** Keep controllers thin. They should only handle HTTP requests/responses, extract parameters/body, and delegate business logic to services.
3. **DTOs.** Always use Data Transfer Objects (DTOs) for request payloads and validate them using `class-validator` and `class-transformer`. Do not use implicit validation.
4. **Dependency Injection.** Rely heavily on NestJS dependency injection. Avoid instantiating classes manually with `new` if they can be injected.
5. **Error Handling.** Use NestJS built-in exceptions (e.g., `NotFoundException`, `BadRequestException`) for consistent error responses instead of manually constructing error objects.
6. **Nx.** Always use `nx` commands to generate code (e.g. `nx g @nx/nest:resource name`).

## Example Controller

```ts
import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('items')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.appService.findOne(id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  @Post()
  async create(@Body() createItemDto: CreateItemDto) {
    return await this.appService.create(createItemDto);
  }
}
```

## Example DTO

```ts
import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsInt()
  @Min(0)
  readonly quantity: number;
}
```
