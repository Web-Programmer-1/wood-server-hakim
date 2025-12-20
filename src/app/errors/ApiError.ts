export class ApiError extends Error {
  statusCode: number;
  errors?: any;
  errorCode?: string;

  constructor(
    statusCode: number,
    message: string,
    errors?: any,
    errorCode?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.errorCode = errorCode;
  }
}
