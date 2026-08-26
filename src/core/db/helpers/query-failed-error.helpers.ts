import { QueryFailedError } from 'typeorm';

type QueryFailedErrorDetails = {
  code?: string;
  constraint?: string;
};

type QueryFailedErrorMatcher = {
  code?: string;
  constraint?: string;
  constraintIncludes?: string;
  constraintIn?: string[];
};

export function getQueryFailedErrorDetails(
  error: unknown,
): QueryFailedErrorDetails | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  return error as QueryFailedErrorDetails;
}

export function matchesQueryFailedError(
  error: unknown,
  matcher: QueryFailedErrorMatcher,
): boolean {
  const details = getQueryFailedErrorDetails(error);
  if (!details) {
    return false;
  }

  if (matcher.code && details.code !== matcher.code) {
    return false;
  }

  if (matcher.constraint && details.constraint !== matcher.constraint) {
    return false;
  }

  if (
    matcher.constraintIncludes &&
    !details.constraint?.includes(matcher.constraintIncludes)
  ) {
    return false;
  }

  if (
    matcher.constraintIn &&
    !matcher.constraintIn.includes(details.constraint ?? '')
  ) {
    return false;
  }

  return true;
}
