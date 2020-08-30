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
import { Events, Event, Participant } from "../common/entities";
import * as Params from "../common/params";
import { loadServices, ServiceProvider } from "../common/services";
import { ConversationRepository } from "../common/db/types";
import { CognitoIdentityServiceProvider } from "aws-sdk";

const services = loadServices();

export interface EventContext {
  connectionId: string;
  endpoint: string;
}

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
        const result = await onEvent(event);
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

export const onEvent = async (
  { conversationRepo }: ServiceProvider,
  apiGatewayEvent: APIGatewayEvent
): Promise<void> => {
  const parsedEvent = parseEvent(apiGatewayEvent);
  await conversationRepo
    .appendEvent(parsedEvent.event)
    .then(async () => broadcastEvent(conversationRepo, parsedEvent));
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

export const broadcastEvent = async (
  conversationRepo: ConversationRepository,
  { event, endpoint, connectionId }: ParsedEvent
) => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint,
  });
  await conversationRepo
    .getParticipants(event.convoId)
    .then(async (participants) => {
      const broadcastRequests = participants.map((participant) => {
        const { connId } = participant as Required<Participant>;
        apigwManagementApi.postToConnection({
          ConnectionId: connId,
          Data: event,
        });
      });
      await Promise.all(broadcastRequests);
    });
};

// let send = undefined;
// function init(event) {
//   console.log(event);
//   const apigwManagementApi = new AWS.ApiGatewayManagementApi({
//     apiVersion: "2018-11-29",
//     endpoint:
//       event.requestContext.domainName + "/" + event.requestContext.stage,
//   });
//   send = async (connectionId, data) => {
//     await apigwManagementApi
//       .postToConnection({ ConnectionId: connectionId, Data: `Echo: ${data}` })
//       .promise();
//   };
// }
