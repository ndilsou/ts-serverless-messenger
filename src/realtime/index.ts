import {
  APIGatewayEvent,
  APIGatewayProxyResultV2,
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayEventRequestContext,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { DdbConversationRepository, DdbUserRepository } from "../common/db";
import { isAppError } from "../common/errors";
import { Events } from "../common/entities";
import * as Params from "../common/params";

const tableName = Params.getTableName();
const docClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
});
const conversationRepo = new DdbConversationRepository({
  client: docClient,
  tableName,
});

const userRepo = new DdbUserRepository({ client: docClient, tableName });

export interface ParsedEvent {
  routeKey: string;
  connectionId: string;
  event: Events[keyof Events];
  endpoint: string;
}

export const dispatchWebsocketEvent = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResultV2<APIGatewayProxyStructuredResultV2>> => {
  let response;
  try {
    switch (event.requestContext.routeKey) {
      case "$connect":
        await onConnect(event);
        response = { statusCode: 200 };
        break;

      case "$disconnect":
        await onDisconnect(event);
        response = { statusCode: 200 };
        break;

      case "$default":
        response = {
          statusCode: 500,
          body: JSON.stringify({ error: "Not Implemented" }),
        };
        break;

      default:
        response = { statusCode: 404 };
    }
  } catch (error) {
    if (isAppError(error)) {
      response = {
        statusCode: error.httpCode,
        body: JSON.stringify({
          error: { message: error.message, name: error.name },
        }),
      };
    } else {
      response = { statusCode: 500, body: JSON.stringify({ error }) };
    }
  }

  return response;
};

export const onConnect = async (apiGatewayEvent: APIGatewayEvent) => {
  const { event, connectionId } = parseEvent(apiGatewayEvent);
  await conversationRepo.createConnection({
    connId: connectionId,
    userId: event.userId,
    convoId: event.convoId,
  });
};

export const onDisconnect = async (apiGatewayEvent: APIGatewayEvent) => {
  const { event } = parseEvent(apiGatewayEvent);
  await conversationRepo.removeConnection({
    userId: event.userId,
    convoId: event.convoId,
  });
};

export const parseEvent = ({
  requestContext: { connectionId, stage, domainName, routeKey },
  body,
}: APIGatewayEvent): ParsedEvent => {
  if (body === null) {
    throw new Error("Body missing from the event");
  }
  return {
    connectionId: connectionId!,
    routeKey: routeKey!,
    event: JSON.parse(body),
    endpoint: domainName + "/" + stage,
  };
};
