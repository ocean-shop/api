import { IsIn } from 'class-validator';

export class ChangeCategorySortDto {
  @IsIn(['up', 'down'])
  readonly direction: 'up' | 'down';
}
