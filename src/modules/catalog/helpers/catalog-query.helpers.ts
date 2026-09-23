import {
  ATTRIBUTE_GROUP_SEPARATOR,
  ATTRIBUTE_NAME_SEPARATOR,
  ATTRIBUTE_VALUE_SEPARATOR,
} from '../constants/attribute-filter.constants';
import { CatalogFilter } from '../models/product.models';

function toRawAttributeGroups(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : [value];

  return rawValues
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(ATTRIBUTE_GROUP_SEPARATOR))
    .map((group) => group.trim())
    .filter((group) => group.length > 0);
}

export function parseAttributeFilters(
  value: unknown,
): CatalogFilter[] | undefined {
  const valuesByName = new Map<string, string[]>();

  for (const group of toRawAttributeGroups(value)) {
    const separatorIndex = group.indexOf(ATTRIBUTE_NAME_SEPARATOR);

    if (separatorIndex <= 0) {
      continue;
    }

    const name = group.slice(0, separatorIndex).trim();
    const values = group
      .slice(separatorIndex + 1)
      .split(ATTRIBUTE_VALUE_SEPARATOR)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (name.length === 0 || values.length === 0) {
      continue;
    }

    const existingValues = valuesByName.get(name);

    if (existingValues) {
      existingValues.push(...values);
      continue;
    }

    valuesByName.set(name, values);
  }

  if (valuesByName.size === 0) {
    return undefined;
  }

  return Array.from(valuesByName, ([name, values]) => ({
    name,
    values: Array.from(new Set(values)),
  }));
}

export function parseBoolean(value: unknown): unknown {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}
