import { error, result } from '../result';

describe('Result Functions', () => {
  describe('result', () => {
    it('should create a successful result tuple with a value', () => {
      // Arrange
      const value = 'success value';

      // Act
      const [err, res] = result(value);

      // Assert
      expect(err).toBeUndefined();
      expect(res).toBe(value);
    });

    it('should create a successful result with complex object', () => {
      // Arrange
      const value = { id: 1, items: [1, 2, 3], name: 'test' };

      // Act
      const [err, res] = result(value);

      // Assert
      expect(err).toBeUndefined();
      expect(res).toEqual(value);
      if (res) {
        expect(res.id).toBe(1);
        expect(res.items).toHaveLength(3);
      }
    });

    it('should create a successful result with null value', () => {
      // Arrange & Act
      const [err, res] = result(null);

      // Assert
      expect(err).toBeUndefined();
      expect(res).toBeNull();
    });

    it('should create a successful result with undefined value (default)', () => {
      // Arrange & Act
      const [err, res] = result();

      // Assert
      expect(err).toBeUndefined();
      expect(res).toBeUndefined();
    });

    it('should handle boolean values correctly', () => {
      // Arrange & Act
      const [err1, res1] = result(true);
      const [err2, res2] = result(false);

      // Assert
      expect(err1).toBeUndefined();
      expect(res1).toBe(true);
      expect(err2).toBeUndefined();
      expect(res2).toBe(false);
    });

    it('should handle zero and empty string as valid success values', () => {
      // Arrange & Act
      const [err1, res1] = result(0);
      const [err2, res2] = result('');

      // Assert
      expect(err1).toBeUndefined();
      expect(res1).toBe(0);
      expect(err2).toBeUndefined();
      expect(res2).toBe('');
    });

    it('should handle arrays and objects correctly', () => {
      // Arrange & Act
      const [err1, res1] = result([]);
      const [err2, res2] = result({});

      // Assert
      expect(err1).toBeUndefined();
      expect(res1).toEqual([]);
      expect(err2).toBeUndefined();
      expect(res2).toEqual({});
    });

    it('should return a success result with a value', () => {
      const [err, res] = result('test-result');
      expect(err).toBeUndefined();
      expect(res).toBe('test-result');
    });

    it('should return a success result with no value', () => {
      const [err, res] = result();
      expect(err).toBeUndefined();
      expect(res).toBeUndefined();
    });
  });

  describe('error', () => {
    it('should create an error tuple with an error message', () => {
      // Arrange
      const errorMessage = 'error message';

      // Act
      const [err] = error(errorMessage);

      // Assert
      expect(err).toBe(errorMessage);
    });

    it('should create an error tuple with Error object', () => {
      // Arrange
      const errorObj = new Error('Something went wrong');

      // Act
      const [err] = error(errorObj);

      // Assert
      expect(err).toBe(errorObj);
      expect(err).toBeInstanceOf(Error);
    });

    it('should create an error tuple with complex error object', () => {
      // Arrange
      const errorObj = {
        code: 'VALIDATION_ERROR',
        details: { field: 'email', value: 'invalid-email' },
        message: 'Invalid input',
      };

      // Act
      const [err] = error(errorObj);

      // Assert
      expect(err).toEqual(errorObj);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details.field).toBe('email');
    });

    it('should handle primitive error values', () => {
      // Arrange & Act
      const [numErr] = error(404);
      const [boolErr] = error(true);
      const [nullErr] = error(null);

      // Assert
      expect(numErr).toBe(404);
      expect(boolErr).toBe(true);
      expect(nullErr).toBeNull();
    });

    it('should return a failure result', () => {
      const [err, res] = error('test-error');
      expect(err).toBe('test-error');
      expect(res).toBeUndefined();
    });
  });

  describe('Type safety and tuple behavior', () => {
    it('should maintain type safety for result tuples', () => {
      // Arrange
      type UserData = { id: number; name: string };
      const userData: UserData = { id: 1, name: 'John' };

      // Act
      const [err, res] = result(userData);

      // Assert - TypeScript should infer correct types
      expect(err).toBeUndefined();
      if (res) {
        expect(res.id).toBe(1);
        expect(res.name).toBe('John');
      }
    });

    it('should maintain type safety for error tuples', () => {
      // Arrange
      type ErrorData = { code: number; message: string };
      const errorData: ErrorData = { code: 404, message: 'Not found' };

      // Act
      const [err] = error(errorData);

      // Assert - TypeScript should infer correct types
      expect(err.code).toBe(404);
      expect(err.message).toBe('Not found');
    });

    it('should work with destructuring patterns', () => {
      // Arrange
      const successValue = 'success';
      const errorValue = 'failure';

      // Act
      const [, successRes] = result(successValue);
      const [errorRes] = error(errorValue);

      // Assert
      expect(successRes).toBe(successValue);
      expect(errorRes).toBe(errorValue);
    });

    it('should handle const assertions correctly', () => {
      // Arrange
      const specificError = 'SPECIFIC_ERROR' as const;
      const specificResult = { id: 123, type: 'user' } as const;

      // Act
      const [err] = error(specificError);
      const [, res] = result(specificResult);

      // Assert
      expect(err).toBe('SPECIFIC_ERROR');
      expect(res?.type).toBe('user');
      expect(res?.id).toBe(123);
    });
  });

  describe('Functional patterns', () => {
    it('should work with conditional logic based on tuple structure', () => {
      // Arrange
      const processResult = <T>(input: T): string => {
        if (Math.random() > 0.5) {
          const [, res] = result(input);
          return `Success: ${res}`;
        } else {
          const [err] = error('Processing failed');
          return `Error: ${err}`;
        }
      };

      // Act & Assert - Just verify the function structure works
      const mockResult = processResult('test');
      expect(typeof mockResult).toBe('string');
      expect(
        mockResult.startsWith('Success:') || mockResult.startsWith('Error:'),
      ).toBe(true);
    });

    it('should support chaining and transformation patterns', () => {
      // Arrange
      const values = [1, 2, 3];
      const results = values.map((v) => result(v * 2));
      const errors = ['err1', 'err2'].map((e) => error(e));

      // Act
      const successValues = results.map(([, res]) => res);
      const errorValues = errors.map(([err]) => err);

      // Assert
      expect(successValues).toEqual([2, 4, 6]);
      expect(errorValues).toEqual(['err1', 'err2']);
    });
  });

  describe('Usage', () => {
    function mightFail(shouldFail: boolean): any {
      if (shouldFail) {
        return error('it-failed');
      }
      return result({ data: 'it-worked' });
    }

    it('should handle success', () => {
      const [err, res] = mightFail(false);
      if (err !== undefined) {
        fail('should not have failed');
      }
      expect(res?.data).toBe('it-worked');
    });

    it('should handle failure', () => {
      const [err, res] = mightFail(true);
      if (res !== undefined) {
        fail('should not have succeeded');
      }
      expect(err).toBe('it-failed');
    });
  });
});
