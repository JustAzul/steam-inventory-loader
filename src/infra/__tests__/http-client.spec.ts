import { UUID, randomUUID } from 'crypto';
import { IncomingHttpHeaders } from 'http';

import { IHttpClient } from '@application/ports/http-client.interface';
import { HttpClient } from '@infra/http-client';
import Fastify from 'fastify';

const ERROR_STATUS_CODES = [401, 402, 403, 404, 500];

type RequestData = {
  // body?: string;
  headers: IncomingHttpHeaders;
};

executeTest(new HttpClient());

function executeTest(httpClient: IHttpClient) {
  describe(httpClient.constructor.name, () => {
    const defaultServerResponse = { message: 'Hello World!' };
    const server = Fastify();
    let address: string;

    const requestsMap: Map<UUID, RequestData> = new Map();

    beforeAll(async () => {
      server.get('/:status', (req, res) => {
        const targetStatusCode =
          (req.params as Record<'status', number>)?.status || 200;

        const requestId = randomUUID();
        const headersReceived = req.headers;

        requestsMap.set(requestId, {
          // body: JSON.stringify(req.body),
          headers: headersReceived,
        });

        res
          .status(targetStatusCode)
          .header('x-request-id', requestId)
          .send(defaultServerResponse);
      });

      address = await server.listen();
    });

    afterAll(async () => server.close());
    beforeEach(() => requestsMap.clear());

    it('should send the request with the correct headers', async () => {
      const headers = {
        'x-custom-header': 'custom-header-value',
      };

      const forceStatusCode = 200;

      const [error, response] = await httpClient.get<
        typeof defaultServerResponse
      >({
        headers,
        url: `${address}/${forceStatusCode}`,
      });

      expect(error).toBeUndefined();
      expect(response?.headers['x-request-id']).toBeDefined();

      const httpServerResponse = requestsMap.get(
        response?.headers['x-request-id'] as UUID,
      );

      expect(httpServerResponse).toBeDefined();
      expect(httpServerResponse?.headers).toMatchObject(headers);
    });

    it('should complete a GET request', async () => {
      const [error, response] = await httpClient.get({
        url: `${address}/200`,
      });

      expect(error).toBeUndefined();
      expect(response?.data).toMatchObject(defaultServerResponse);
    });

    it('should not return response when request fails', async () => {
      const results = await Promise.all(
        ERROR_STATUS_CODES.map((statusCode) =>
          httpClient.get({
            url: `${address}/${statusCode}`,
          }),
        ),
      );

      for (const [, serverResponse] of results) {
        expect(serverResponse).toBeUndefined();
      }
    });

    it('should return HTTP_CLIENT_ERROR when the request fails', async () => {
      const results = await Promise.all(
        ERROR_STATUS_CODES.map((statusCode) =>
          httpClient.get({
            url: `${address}/${statusCode}`,
          }),
        ),
      );

      for (const [error] of results) {
        expect(error?.code).toEqual('HTTP_CLIENT_ERROR');
      }
    });

    it('should return headers when the request fails', async () => {
      const results = await Promise.all(
        ERROR_STATUS_CODES.map((statusCode) =>
          httpClient.get({
            url: `${address}/${statusCode}`,
          }),
        ),
      );

      for (const [error] of results) {
        expect(error?.code).toEqual('HTTP_CLIENT_ERROR');
        expect(error?.payload.response.headers).toBeDefined();
        expect(error?.payload.response.headers).toBeInstanceOf(Object);
      }
    });

    it('should return the status code on the error payload', async () => {
      for (const statusCode of ERROR_STATUS_CODES) {
        const [error] = await httpClient.get({
          url: `${address}/${statusCode}`,
        });

        expect(error?.payload.response.statusCode).toEqual(statusCode);
      }
    });
  });
}
