import { UseCaseException } from '@application/exceptions';
import {
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '@domain/constants';

import { validateEndpoint } from '../validate-endpoint';

describe('validateEndpoint', () => {
  it('should not throw an error for a valid endpoint', () => {
    const validEndpoint = `http://test.com/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_APP_ID}/${PLACEHOLDER_CONTEXT_ID}`;
    expect(() => validateEndpoint(validEndpoint)).not.toThrow();
  });

  it('should throw an error if placeholders are missing', () => {
    const invalidEndpoint = 'http://test.com';
    expect(() => validateEndpoint(invalidEndpoint)).toThrow(UseCaseException);
    expect(() => validateEndpoint(invalidEndpoint)).toThrow(
      `The endpoint must contain the placeholders ${PLACEHOLDER_APP_ID}, ${PLACEHOLDER_CONTEXT_ID} and ${PLACEHOLDER_STEAM_ID_64}`,
    );
  });

  it('should throw an error if protocol is missing', () => {
    const invalidEndpoint = `test.com/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_APP_ID}/${PLACEHOLDER_CONTEXT_ID}`;
    expect(() => validateEndpoint(invalidEndpoint)).toThrow(UseCaseException);
    expect(() => validateEndpoint(invalidEndpoint)).toThrow(
      'The endpoint must contain the protocol http:// or https://',
    );
  });

  it('should handle https protocol', () => {
    const validEndpoint = `https://test.com/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_APP_ID}/${PLACEHOLDER_CONTEXT_ID}`;
    expect(() => validateEndpoint(validEndpoint)).not.toThrow();
  });
});
