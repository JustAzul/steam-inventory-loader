import { UseCaseException } from '@application/exceptions';
import {
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '@domain/constants';

const PROTOCOL_HTTP = 'http://';
const PROTOCOL_HTTPS = 'https://';

export const validateEndpoint = (endpoint: string): void => {
  const hasPlaceholders =
    endpoint.includes(PLACEHOLDER_APP_ID) &&
    endpoint.includes(PLACEHOLDER_CONTEXT_ID) &&
    endpoint.includes(PLACEHOLDER_STEAM_ID_64);

  if (!hasPlaceholders) {
    throw new UseCaseException(
      'validateEndpoint',
      `The endpoint must contain the placeholders ${PLACEHOLDER_APP_ID}, ${PLACEHOLDER_CONTEXT_ID} and ${PLACEHOLDER_STEAM_ID_64}`,
    );
  }
  const hasProtocol =
    endpoint.startsWith(PROTOCOL_HTTP) || endpoint.startsWith(PROTOCOL_HTTPS);

  if (!hasProtocol) {
    throw new UseCaseException(
      'validateEndpoint',
      `The endpoint must contain the protocol ${PROTOCOL_HTTP} or ${PROTOCOL_HTTPS}`,
    );
  }
};
