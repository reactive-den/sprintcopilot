export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class RateLimitError extends AppError {
  constructor(public resetTime?: Date) {
    super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
    this.resetTime = resetTime;
  }
}

export class LLMError extends AppError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message, 500, 'LLM_ERROR');
    this.originalError = originalError;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export const handleApiError = (error: unknown) => {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error instanceof ValidationError && { details: error.details }),
      ...(error instanceof RateLimitError && { resetTime: error.resetTime }),
    };
  }

  // Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: (error as { issues: unknown }).issues,
    };
  }

  // Generic error
  return {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
};

// Retry utility for LLM calls
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new LLMError(`Failed after ${maxRetries} retries`, lastError);
}
