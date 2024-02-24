import { IncomingHttpHeaders } from 'http';

import { IHttpClient } from '@application/ports/http-client.interface';
import { HttpClient } from '@infra/http-client';
import Fastify from 'fastify';

const ERROR_STATUS_CODES = [401, 402, 403, 404, 500];

type ReceivedRequest = {
  headers?: IncomingHttpHeaders;
};

executeTest(new HttpClient());

function executeTest(httpClient: IHttpClient) {
  describe(httpClient.constructor.name, () => {
    const defaultServerResponse = { message: 'Hello World!' };
    const server = Fastify();
    let address: string;

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

      address = await server.listen();
    });

    afterAll(async () => server.close());
    beforeEach(() => receivedRequestData.clear());

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

    // it('should send the request with the correct headers', async () => {
    //   const httpClient = new HttpClient();

    //   const headers = {
    //     'x-custom-header': 'custom-header-value',
    //   };

    //   const forceStatusCode = StatusCode.SuccessOK;

    //   const httpClientResponse = await httpClient.get<
    //     typeof defaultServerResponse
    //   >({
    //     url: `http://localhost:${port}/${forceStatusCode}`,
    //     headers,
    //   });

    //   const httpServerResponse = receivedRequestData.get(
    //     `get#${forceStatusCode}`,
    //   );

    //   const hasHttpServerResponse = Boolean(httpServerResponse);
    //   const hasHttpClientResponse = Boolean(httpClientResponse);

    //   expect(hasHttpServerResponse).toBe(true);
    //   expect(hasHttpClientResponse).toBe(true);

    //   if (hasHttpServerResponse && hasHttpClientResponse) {
    //     expect(httpServerResponse?.headers).toMatchObject(headers);
    //   }

    //   expect(httpClientResponse?.data).toMatchObject(defaultServerResponse);
    // });
  });
}
