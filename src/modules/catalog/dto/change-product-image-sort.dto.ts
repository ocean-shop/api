import { IsIn } from 'class-validator';

export class ChangeProductImageSortDto {
  @IsIn(['up', 'down'])
  readonly direction: 'up' | 'down';
}
