import { EROFS } from "constants";

export type httpCode = 500 | 400 | 404;

export class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: httpCode;
  public readonly isOperational: boolean;
  constructor(
    name: string,
    httpCode: httpCode,
    description: string,
    isOperational: boolean
  ) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.httpCode = httpCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}

export const replaceErrors = (key: any, value: any): any => {
  if (value instanceof Error) {
    var error: { [key: string]: any } = {};

    Object.getOwnPropertyNames(value).forEach((key) => {
      if (isValidErrorKey(key)) {
        error[key] = value[key];
      }
    });

    return error;
  }

  return value;
};

const isValidErrorKey = (key: string): key is keyof Error => {
  return key in Error;
};

export const isAppError = (error: Error | AppError): error is AppError => {
  return "name" in error && "httpCode" in error && "isOperational" in error;
};
export const isStandardError = (error: Error | object): error is Error => {
  return error instanceof Error;
};
