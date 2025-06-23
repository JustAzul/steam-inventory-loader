import { ErrorCode, ErrorPayload, ErrorPayloadProps } from '../errors';

describe('Shared Errors Module', () => {
  describe('ErrorCode', () => {
    it('should create an error code with string type', () => {
      // Arrange
      const code = 'TEST_ERROR';

      // Act
      const errorCode = new ErrorCode(code);

      // Assert
      expect(errorCode.code).toBe(code);
      expect(errorCode).toBeInstanceOf(ErrorCode);
    });

    it('should create an error code with number type', () => {
      // Arrange
      const code = 404;

      // Act
      const errorCode = new ErrorCode(code);

      // Assert
      expect(errorCode.code).toBe(code);
      expect(typeof errorCode.code).toBe('number');
    });

    it('should preserve const type for code', () => {
      // Arrange
      const code = 'SPECIFIC_ERROR' as const;

      // Act
      const errorCode = new ErrorCode(code);

      // Assert
      expect(errorCode.code).toBe('SPECIFIC_ERROR');
    });
  });

  describe('ErrorPayload', () => {
    it('should create an error payload with correct properties', () => {
      // Arrange
      const props: ErrorPayloadProps<string, { message: string; status: number }> = {
        code: 'VALIDATION_ERROR',
        payload: {
          message: 'Invalid input provided',
          status: 400,
        },
      };

      // Act
      const errorPayload = new ErrorPayload(props);

      // Assert
      expect(errorPayload.code).toBe(props.code);
      expect(errorPayload.payload).toEqual(props.payload);
      expect(errorPayload).toBeInstanceOf(ErrorPayload);
    });

    it('should handle different payload types', () => {
      // Arrange
      const props: ErrorPayloadProps<number, string[]> = {
        code: 500,
        payload: ['Error 1', 'Error 2', 'Error 3'],
      };

      // Act
      const errorPayload = new ErrorPayload(props);

      // Assert
      expect(errorPayload.code).toBe(500);
      expect(errorPayload.payload).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });

    it('should handle empty payload object', () => {
      // Arrange
      const props: ErrorPayloadProps<string, Record<string, unknown>> = {
        code: 'EMPTY_ERROR',
        payload: {},
      };

      // Act
      const errorPayload = new ErrorPayload(props);

      // Assert
      expect(errorPayload.code).toBe('EMPTY_ERROR');
      expect(errorPayload.payload).toEqual({});
    });

    it('should create correct string representation', () => {
      // Arrange
      const props: ErrorPayloadProps<string, { field: string; value: number }> = {
        code: 'FIELD_ERROR',
        payload: {
          field: 'email',
          value: 123,
        },
      };
      const errorPayload = new ErrorPayload(props);

      // Act
      const stringRepresentation = errorPayload.toString();

      // Assert
      expect(stringRepresentation).toContain('ErrorPayload:');
      expect(stringRepresentation).toContain('code: FIELD_ERROR');
      expect(stringRepresentation).toContain('field');
      expect(stringRepresentation).toContain('email');
      expect(stringRepresentation).toContain('value');
      expect(stringRepresentation).toContain('123');
    });

    it('should handle complex nested payload in toString', () => {
      // Arrange
      const props: ErrorPayloadProps<string, { user: { id: number; details: { name: string } } }> = {
        code: 'USER_ERROR',
        payload: {
          user: {
            id: 1,
            details: {
              name: 'John Doe',
            },
          },
        },
      };
      const errorPayload = new ErrorPayload(props);

      // Act
      const stringRepresentation = errorPayload.toString();

      // Assert
      expect(stringRepresentation).toContain('ErrorPayload:');
      expect(stringRepresentation).toContain('USER_ERROR');
      expect(stringRepresentation).toContain('John Doe');
      expect(stringRepresentation).toContain('id');
      expect(stringRepresentation).toContain('1');
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety with const types', () => {
      // Arrange
      type SpecificErrorCode = 'AUTH_FAILED' | 'PERMISSION_DENIED';
      type SpecificPayload = { userId: number; resource: string };

      const code: SpecificErrorCode = 'AUTH_FAILED';
      const payload: SpecificPayload = {
        userId: 123,
        resource: 'user_profile',
      };

      // Act
      const errorPayload = new ErrorPayload({ code, payload });

      // Assert
      expect(errorPayload.code).toBe('AUTH_FAILED');
      expect(errorPayload.payload.userId).toBe(123);
      expect(errorPayload.payload.resource).toBe('user_profile');
    });

    it('should work with union types for codes', () => {
      // Arrange
      type HttpStatusCode = 400 | 401 | 403 | 404 | 500;
      const code: HttpStatusCode = 404;
      const payload = { url: '/api/users/999', method: 'GET' };

      // Act
      const errorPayload = new ErrorPayload({ code, payload });

      // Assert
      expect(errorPayload.code).toBe(404);
      expect(errorPayload.payload.url).toBe('/api/users/999');
    });
  });

  describe('ErrorPayloadProps type', () => {
    it('should enforce correct structure', () => {
      // Arrange & Act
      const validProps: ErrorPayloadProps<string, { message: string }> = {
        code: 'TEST_CODE',
        payload: { message: 'Test message' },
      };

      // Assert
      expect(validProps.code).toBe('TEST_CODE');
      expect(validProps.payload.message).toBe('Test message');
    });
  });
}); 