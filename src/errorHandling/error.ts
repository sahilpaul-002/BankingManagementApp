// src/errors/httpErrors.ts

import { AppErrorClass } from './appError';


export class ApplicationServiceError extends AppErrorClass {
  constructor(message: string, error?: any) {
    super(601, 'APPLICATION_SERVICE_ERROR', message, error);
  }
}

export class InternalApplicationError extends AppErrorClass {
  constructor(message: string, error?: any) {
    super(600, 'INTERNAL_APPLICATION_ERROR', message, error);
  }
}