import Fastify from 'fastify';
import FindOpenPort from 'find-open-port';
import HttpClient from '../http-client';

describe(HttpClient.name, () => {
  const defaultServerResponse = { message: 'Hello World!' };
  const server = Fastify();
  let port = 0;

  const receivedRequestData: Map<
    string,
    Record<'headers' | 'body', any>
  > = new Map();

  beforeAll(async () => {
    server.get('/', ({ body, headers }, reply) => {
      receivedRequestData.set('get', {
        headers,
        body,
      });

      reply.send(defaultServerResponse);
    });

    port = await FindOpenPort();

    await server.listen({
      port,
    });
  });

  afterAll(async () => server.close());
  beforeEach(() => receivedRequestData.clear());

  it('should send the request with the correct headers', async () => {
    const httpClient = new HttpClient();

    const headers = {
      'x-custom-header': 'custom-header-value',
    };

    const httpClientResponse = await httpClient.get<
      typeof defaultServerResponse
    >({
      url: `http://localhost:${port}`,
      headers,
    });

    const httpServerResponse = receivedRequestData.get('get');

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
