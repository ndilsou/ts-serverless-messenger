import { handler } from '.';
import { APIGatewayEvent, APIGatewayProxyStructuredResultV2, APIGatewayEventIdentity } from 'aws-lambda';

describe('Websocket Handler', () => {
  it('when receiving a connect event, inserts the connection id in the db', async () => {
    const event = generateEvent({
      routeKey: '$connect',
    });

    const response = (await handler(
      event,
    )) as APIGatewayProxyStructuredResultV2;
    // const body = extractResponseBody(response);

    expect(response).toStrictEqual({ statusCode: 200 });
  });

  it('when receiving a connect event, remove the connection id from the db', async () => {
    const event = generateEvent({
      routeKey: '$disconnect',
    });

    const response = (await handler(
      event,
    )) as APIGatewayProxyStructuredResultV2;

    expect(response).toStrictEqual({ statusCode: 200 });
  });

  it('when receiving a default event, broadcasts the message to subscribers', async () => {
    const event = generateEvent({
      routeKey: '$default',
    });

    const response = (await handler(
      event,
    )) as APIGatewayProxyStructuredResultV2;

    expect(response).toMatchObject({ statusCode: 200 });
  });
});

interface GenerateEventProps {
  routeKey: string;
  body?: string | null;
}

const generateEvent = ({
  routeKey,
  body = null,
}: GenerateEventProps): APIGatewayEvent => ({
  body,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: true,
  path: '/',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    path: '/',
    identity: {} as APIGatewayEventIdentity,
    httpMethod: 'GOT',
    protocol: 'WEBSOCKET',
    requestId: 'weeewee',
    resourceId: 'adasd',
    resourcePath: '/asdas',
    accountId: '123456789012',
    connectionId: '123456',
    routeKey,
    stage: '$default',
    requestTimeEpoch: 1428582896000,
    apiId: 'sfafasdda',
    domainName: 'id.execute-api.us-east-1.amazonaws.com',
    authorizer: {
      jwt: {
        claims: {
          claim1: 'value1',
          claim2: 'value2',
        },
      },
    },
  },
  resource: 'asdasd',
});

const extractResponseBody = (response: APIGatewayProxyStructuredResultV2) => {
  const result = JSON.parse(response.body!);
  return JSON.parse(result?.body);
};
