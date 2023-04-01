import UseCaseException from '../exceptions/use-case.exception';

export type ValidateEndpointProps = {
  endpoint: string;
};

export default class ValidateEndpointUseCase {
  private readonly props: ValidateEndpointProps;

  public constructor(props: Readonly<ValidateEndpointProps>) {
    this.props = props;
  }

  public execute(): void {
    const { endpoint } = this.props;

    const containsAppID = endpoint.includes('{appID}');
    const containsContextID = endpoint.includes('{contextID}');
    const containsSteamID64 = endpoint.includes('{steamID64}');

    const containsHttp = endpoint.includes('http://');
    const containsHttps = endpoint.includes('https://');

    if (containsHttp === false && containsHttps === false) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The custom endpoint must contain the 'http://' or 'https://' protocol.`,
      );
    }

    if (containsSteamID64 === false) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The custom endpoint must contain the '{steamID64}' placeholder.`,
      );
    }

    if (containsAppID === false) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The custom endpoint must contain the '{appID}' placeholder.`,
      );
    }

    if (containsContextID === false) {
      throw new UseCaseException(
        ValidateEndpointUseCase.name,
        `The custom endpoint must contain the '{contextID}' placeholder.`,
      );
    }
  }
}
