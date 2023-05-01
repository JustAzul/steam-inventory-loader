import Fastify from 'fastify';
import FindOpenPort from 'find-open-port';
import HttpClient from '../http-client';
import HttpException from '../../application/exceptions/http.exception';
import { IncomingHttpHeaders } from 'http';
import StatusCode from 'status-code-enum';

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
};

describe(HttpClient.name, () => {
  const defaultServerResponse = { message: 'Hello World!' };
  const server = Fastify();
  let port = 0;

  const receivedRequestData: Map<string, ReceivedRequest> = new Map();

  beforeAll(async () => {
    server.get('/:status', (req, response) => {
      const statusCodeToReply =
        (req.params as Record<'status', number>)?.status || 200;

      receivedRequestData.set(`get#${statusCodeToReply}`, {
        headers: req.headers,
      });

      response.status(statusCodeToReply).send(defaultServerResponse);
    });

    port = await FindOpenPort();

    await server.listen({
      port,
    });
  });

  afterAll(async () => server.close());
  beforeEach(() => receivedRequestData.clear());

  it('should throw HTTP Exception when the request fails', async () => {
    const httpClient = new HttpClient();

    const forceStatusCodes = Object.keys(StatusCode)
      .map(Number)
      .filter((code) => Boolean(code) && (code < 200 || code >= 300));

    for (const statusCode of forceStatusCodes) {
      try {
        await httpClient.get({
          url: `http://localhost:${port}/${statusCode}`,
        });
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
      }
    }
  });

  it('should send the request with the correct headers', async () => {
    const httpClient = new HttpClient();

    const headers = {
      'x-custom-header': 'custom-header-value',
    };

    const forceStatusCode = StatusCode.SuccessOK;

    const httpClientResponse = await httpClient.get<
      typeof defaultServerResponse
    >({
      url: `http://localhost:${port}/${forceStatusCode}`,
      headers,
    });

    const httpServerResponse = receivedRequestData.get(
      `get#${forceStatusCode}`,
    );

    const hasHttpServerResponse = Boolean(httpServerResponse);
    const hasHttpClientResponse = Boolean(httpClientResponse);

    expect(hasHttpServerResponse).toBe(true);
    expect(hasHttpClientResponse).toBe(true);

    if (hasHttpServerResponse && hasHttpClientResponse) {
      expect(httpServerResponse?.headers).toMatchObject(headers);
    }

    expect(httpClientResponse?.data).toMatchObject(defaultServerResponse);
  });
});
