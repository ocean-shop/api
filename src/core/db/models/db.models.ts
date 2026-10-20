export type QueryFailedErrorDetails = {
  code?: string;
  constraint?: string;
};

export type QueryFailedErrorMatcher = {
  code?: string;
  constraint?: string;
  constraintIncludes?: string;
  constraintIn?: readonly string[];
};
