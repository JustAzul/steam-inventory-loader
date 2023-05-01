import {
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '../../../shared/constants';

import UseCaseException from '../../exceptions/use-case.exception';
import ValidateEndpointUseCase from '../validate-endpoint.use-case';

describe(ValidateEndpointUseCase.name, () => {
  const validEndpoint = `https://example.com/${PLACEHOLDER_APP_ID}/${PLACEHOLDER_CONTEXT_ID}/${PLACEHOLDER_STEAM_ID_64}`;

  it('should not throw any exception for a valid endpoint', () => {
    const validateEndpointUseCase = new ValidateEndpointUseCase({
      endpoint: validEndpoint,
    });

    expect(() => {
      validateEndpointUseCase.execute();
    }).not.toThrow();
  });

  it('should throw UseCaseException for missing protocol', () => {
    const invalidEndpoint = validEndpoint.replace('https://', '');

    const validateEndpointUseCase = new ValidateEndpointUseCase({
      endpoint: invalidEndpoint,
    });

    expect(() => {
      validateEndpointUseCase.execute();
    }).toThrow(UseCaseException);
  });

  it('should throw UseCaseException for missing PLACEHOLDER_STEAM_ID_64', () => {
    const invalidEndpoint = validEndpoint.replace(PLACEHOLDER_STEAM_ID_64, '');

    const validateEndpointUseCase = new ValidateEndpointUseCase({
      endpoint: invalidEndpoint,
    });

    expect(() => {
      validateEndpointUseCase.execute();
    }).toThrow(UseCaseException);
  });

  it('should throw UseCaseException for missing PLACEHOLDER_APP_ID', () => {
    const invalidEndpoint = validEndpoint.replace(PLACEHOLDER_APP_ID, '');

    const validateEndpointUseCase = new ValidateEndpointUseCase({
      endpoint: invalidEndpoint,
    });

    expect(() => {
      validateEndpointUseCase.execute();
    }).toThrow(UseCaseException);
  });

  it('should throw UseCaseException for missing PLACEHOLDER_CONTEXT_ID', () => {
    const invalidEndpoint = validEndpoint.replace(PLACEHOLDER_CONTEXT_ID, '');

    const validateEndpointUseCase = new ValidateEndpointUseCase({
      endpoint: invalidEndpoint,
    });

    expect(() => {
      validateEndpointUseCase.execute();
    }).toThrow(UseCaseException);
  });
});
