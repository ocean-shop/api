import { IsIn } from 'class-validator';
import { SORT_DIRECTIONS } from '../../constants/sort.constants';
import type { SortDirection } from '../../models/sort.models';

export class ChangeCategorySortDto {
  @IsIn(SORT_DIRECTIONS)
  readonly direction: SortDirection;
}
