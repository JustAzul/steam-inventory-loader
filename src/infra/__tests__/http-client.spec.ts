import nock from 'nock';
import { IFetcher } from '@application/ports/fetcher.port';
import { HttpClient } from '@infra/http-client';

const TEST_URL = 'http://test.com';
const ERROR_STATUS_CODES = [401, 402, 403, 404, 500];

describe('Infrastructure :: HttpClient', () => {
  let httpClient: IFetcher;
  const defaultServerResponse = { message: 'Hello World!' };

  beforeEach(() => {
    httpClient = new HttpClient();
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('should send the request with the correct headers', async () => {
    const headers = {
      'x-custom-header': 'custom-header-value',
    };

    const scope = nock(TEST_URL, {
      reqheaders: headers,
    })
      .get('/')
      .reply(200, defaultServerResponse, { 'x-request-id': 'some-id' });

    const [error, response] = await httpClient.execute({
      headers,
      url: TEST_URL,
    });

    expect(error).toBeUndefined();
    expect(response?.headers['x-request-id']).toBeDefined();
    expect(scope.isDone()).toBe(true);
  });

  it('should complete a GET request', async () => {
    nock(TEST_URL).get('/').reply(200, defaultServerResponse);

    const [error, response] = await httpClient.execute({
      url: TEST_URL,
    });

    expect(error).toBeUndefined();
    expect(response?.data).toMatchObject(defaultServerResponse);
  });

  it('should not return response when request fails', async () => {
    for (const statusCode of ERROR_STATUS_CODES) {
      nock(TEST_URL).get(`/${statusCode}`).reply(statusCode);

      const [, serverResponse] = await httpClient.execute({
        url: `${TEST_URL}/${statusCode}`,
      });
      expect(serverResponse).toBeUndefined();
    }
  });

  it('should return HTTP_CLIENT_ERROR when the request fails', async () => {
    for (const statusCode of ERROR_STATUS_CODES) {
      nock(TEST_URL).get(`/${statusCode}`).reply(statusCode);
      const [error] = await httpClient.execute({
        url: `${TEST_URL}/${statusCode}`,
      });
      expect(error?.code).toEqual('HTTP_CLIENT_ERROR');
    }
  });

  it('should return headers when the request fails', async () => {
    for (const statusCode of ERROR_STATUS_CODES) {
      const replyHeaders = { 'x-failed-request-id': 'failed-id' };
      nock(TEST_URL)
        .get(`/${statusCode}`)
        .reply(statusCode, undefined, replyHeaders);

      const [error] = await httpClient.execute({
        url: `${TEST_URL}/${statusCode}`,
      });
      expect(error?.code).toEqual('HTTP_CLIENT_ERROR');
      expect(error?.payload.response.headers).toBeDefined();
      expect(error?.payload.response.headers['x-failed-request-id']).toEqual(
        'failed-id',
      );
    }
  });

  it('should return the status code on the error payload', async () => {
    for (const statusCode of ERROR_STATUS_CODES) {
      nock(TEST_URL).get(`/${statusCode}`).reply(statusCode);
      const [error] = await httpClient.execute({
        url: `${TEST_URL}/${statusCode}`,
      });
      expect(error?.payload.response.statusCode).toEqual(statusCode);
    }
  });
});
