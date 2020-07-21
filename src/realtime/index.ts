import {
  APIGatewayEvent,
  APIGatewayProxyResultV2,
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayEventRequestContext,
} from 'aws-lambda';
import * as AWS from 'aws-sdk';

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION });

export interface ParsedEvent {
  routeKey: string;
  connectionId: string;
  event?: object;
  endpoint: string;
}

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResultV2<APIGatewayProxyStructuredResultV2>> => {
  const parsedEvent = parseEvent(event);
  let response;
  switch (parsedEvent.routeKey) {
    case '$connect':
      await onConnect(parsedEvent.connectionId);
      response = { statusCode: 200 };
      break;

    case '$disconnect':
      await onDisconnect(parsedEvent.connectionId);
      response = { statusCode: 200 };
      break;

    case '$default':
      try {
        const result = await dispatch(parsedEvent);
        response = { statusCode: 200, body: JSON.stringify(result) };
      } catch (err) {
        console.log(err);
        response = { statusCode: 500, body: JSON.stringify(err) };
      }
      break;

    default:
      response = { statusCode: 404 };
  }

  return response;
};

export const onConnect = async (connectionId: string) =>
  console.log(connectionId);

export const onDisconnect = async (connectionId: string) =>
  console.log(connectionId);

export const dispatch = async (
  { endpoint, body, connectionId }: ParsedEvent,
) => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint,
  });

  try {
    const data = JSON.stringify(body!);
    await apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: data })
      .promise();
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
    } else {
      throw e;
    }
  }
  console.log({ connectionId, body });
};

export const parseEvent = ({
  requestContext: { connectionId, stage, domainName, routeKey },
  body,
}: APIGatewayEvent): ParsedEvent => ({
    connectionId: connectionId!,
    routeKey: routeKey!,
    event: body ? JSON.parse(body) : undefined,
    endpoint: domainName + '/' + stage,
});
