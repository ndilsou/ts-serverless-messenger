import {
  APIGatewayEvent,
  APIGatewayProxyResultV2,
  Context,
  APIGatewayProxyStructuredResultV2,
  APIGatewayEventRequestContext,
} from "aws-lambda";
import * as AWS from "aws-sdk";
import { DdbConversationRepository, DdbUserRepository } from "../common/db";
import { isAppError, AppError } from "../common/errors";
import { Events, Event, Participant } from "../common/entities";
import * as Params from "../common/params";
import { loadServices, ServiceProvider } from "../common/services";
import { ConversationRepository } from "../common/db/types";
import {
  CognitoIdentityServiceProvider,
  ApiGatewayManagementApi,
  APIGateway,
} from "aws-sdk";

const services = loadServices();

export interface EventContext {
  connectionId: string;
  endpoint: string;
}

export interface HandlerResponse {
  status: boolean;
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

export const handler = async (event: APIGatewayEvent): Promise<void> => {
  console.log(event);
  const respondToSender = createRespondToSenderFromEvent(event);
  try {
    switch (event.requestContext.routeKey) {
      case "connect":
        await onConnect(event);
        await respondToSender({ statusCode: 200, message: "CONNECTED" });
        break;

      case "$disconnect":
        await onDisconnect(event);
        await respondToSender({ statusCode: 200, message: "DISCONNECTED" });
        break;

      // case "$disconnect":
      //   await onDisconnect(event);
      //   response = { statusCode: 200 };
      //   break;

      case "$default":
        await onMessage(event, services);
        break;

      default:
        await respondToSender({
          statusCode: 404,
          error: { message: "Unknown Action" },
        });
    }
  } catch (error) {
    if (isAppError(error)) {
      await respondToSender({
        statusCode: error.httpCode,
        error: { message: error.message, name: error.name },
      });
    } else {
      await respondToSender({
        statusCode: 500,
        error,
      });
    }
  }
};

export const onMessage = async (
  apiGatewayEvent: APIGatewayEvent,
  { conversationRepo }: ServiceProvider
): Promise<void> => {
  const parsedEvent = parseEvent(apiGatewayEvent);
  await conversationRepo
    .appendEvent(parsedEvent.event)
    .then(async () => broadcastEvent(conversationRepo, parsedEvent));
};

export const onConnect = async (apiGatewayEvent: APIGatewayEvent) => {
  const { event, connectionId, endpoint } = parseEvent(apiGatewayEvent);
  await conversationRepo.createConnection({
    connId: connectionId,
    userId: event.userId,
    convoId: event.convoId,
  });

  await new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint,
  })
    .postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({ statusCode: 200, message: "CONNECTED" }),
    })
    .promise();
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
    throw new AppError(
      "InvalidRequestBody",
      400,
      "Body missing from the event",
      true
    );
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
  { event, endpoint }: ParsedEvent
) => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint,
  });
  await conversationRepo
    .getParticipants(event.convoId)
    .then(async (participants) => {
      const broadcastRequests = participants
        .filter((participant) => participant?.connId)
        .map(async (participant) => {
          const { connId } = participant as Required<Participant>;
          await apigwManagementApi
            .postToConnection({
              ConnectionId: connId,
              Data: event,
            })
            .promise();
        });
      await Promise.all(broadcastRequests);
    });
};

export type RespondToSenderFn = {
  (data: any): Promise<{
    $response: AWS.Response<{}, AWS.AWSError>;
  }>;
};

/**
 * creates a function that will send back a payload of data to the sender of the event.
 * @param APIGatewayEvent the event.
 */
const createRespondToSenderFromEvent = ({
  requestContext: { connectionId, stage, domainName },
}: APIGatewayEvent): RespondToSenderFn => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: domainName + "/" + stage,
  });
  const responderFn: RespondToSenderFn = async (data) =>
    await apigwManagementApi
      .postToConnection({
        ConnectionId: connectionId!,
        Data: JSON.stringify(data),
      })
      .promise();

  return responderFn;
};
