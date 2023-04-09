import {
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '../../shared/constants';

import UseCaseException from '../exceptions/use-case.exception';

// Represents the properties required to validate an endpoint
interface ValidateEndpointProps {
  endpoint: string;
}

// Protocol constants
const PROTOCOL_HTTP = 'http://';
const PROTOCOL_HTTPS = 'https://';

export default class ValidateEndpointUseCase {
  private readonly props: ValidateEndpointProps;

  public constructor(props: Readonly<ValidateEndpointProps>) {
    this.props = props;
  }

  public execute(): void {
    const { endpoint } = this.props;

    // Check if the endpoint contains placeholders and protocols
    const hasAppIDPlaceholder = endpoint.includes(PLACEHOLDER_APP_ID);
    const hasContextIDPlaceholder = endpoint.includes(PLACEHOLDER_CONTEXT_ID);
    const hasSteamID64Placeholder = endpoint.includes(PLACEHOLDER_STEAM_ID_64);
    const hasHttpProtocol = endpoint.includes(PROTOCOL_HTTP);
    const hasHttpsProtocol = endpoint.includes(PROTOCOL_HTTPS);

    // Throw an exception if the endpoint is invalid
    if (!hasHttpProtocol && !hasHttpsProtocol) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The endpoint must contain either the '${PROTOCOL_HTTP}' or '${PROTOCOL_HTTPS}' protocol.`,
      );
      return;
    }

    if (!hasSteamID64Placeholder) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The endpoint must contain the '${PLACEHOLDER_STEAM_ID_64}' placeholder.`,
      );
      return;
    }

    if (!hasAppIDPlaceholder) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The endpoint must contain the '${PLACEHOLDER_APP_ID}' placeholder.`,
      );
      return;
    }

    if (!hasContextIDPlaceholder) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The endpoint must contain the '${PLACEHOLDER_CONTEXT_ID}' placeholder.`,
      );
      return;
    }
  }
}
