---
name: unit-testing
description: Authors and reviews Unit Tests in Vitest for Angular (zoneless) and NestJS backend projects. Use ONLY when the user explicitly requests this skill.
disable-model-invocation: true
---

# Unit Testing (Vitest)

This skill encodes the Unit Testing conventions used in this Nx workspace.

## Hard Rules

1. **Vitest.** The workspace uses Vitest, not Jest or Jasmine. Expect `@analogjs/vitest-angular` for Angular projects and standard `vitest` for the NestJS backend. Use `describe`, `it`, `expect` from `vitest`.
2. **Angular Zoneless Testing.** Angular testing uses `provideExperimentalZonelessChangeDetection()`. Do not use `fixture.detectChanges()` blindly after state changes - signal-based bindings and zoneless change detection handle most updates. Use `await fixture.whenStable()` if needed.
3. **Standalone Angular Components.** Configure TestBed with `imports: [Component]` instead of `declarations` for standalone components.
4. **NestJS Testing.** Use `@nestjs/testing` (`Test.createTestingModule`) for the backend. Provide mock implementations of dependencies (e.g. Services/Repositories) to test components in isolation.
5. **Nx Commands.** Run tests using Nx, e.g., `nx test client`, `nx test server`. Do not run vitest directly.

## Example Angular Test

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { expect, describe, it, beforeEach } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideExperimentalZonelessChangeDetection()],
      imports: [Button],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Example NestJS Test

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { expect, describe, it, beforeEach, vi } from 'vitest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const appServiceMock = {
      getData: vi.fn().mockReturnValue({ message: 'Hello API' })
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: appServiceMock },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  it('should return API greeting payload', () => {
    expect(appController.getData()).toEqual({ message: 'Hello API' });
    expect(appService.getData).toHaveBeenCalled();
  });
});
```
