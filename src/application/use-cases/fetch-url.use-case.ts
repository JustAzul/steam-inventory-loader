import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../ports/http-client.interface';

export default class FetchUrlUseCase {
  private httpClient: IHttpClient;

  public constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  public execute<ResponseType>(
    props: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<ResponseType>> {
    return this.httpClient.get<ResponseType>(props);
  }
}
