export class AppError extends Error {
  constructor(
    public readonly code: 'VALIDATION' | 'AUTH' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL',
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createValidationError = (message: string): AppError => new AppError('VALIDATION', message);
export const createAuthError = (message: string): AppError => new AppError('AUTH', message);
export const createForbiddenError = (message: string): AppError => new AppError('FORBIDDEN', message);
export const createNotFoundError = (message: string): AppError => new AppError('NOT_FOUND', message);
export const createConflictError = (message: string): AppError => new AppError('CONFLICT', message);
