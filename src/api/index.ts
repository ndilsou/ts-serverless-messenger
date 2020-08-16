import AWS from "aws-sdk";
import {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyEventV2,
} from "aws-lambda";

import { ApiGatewayRouter, Handler } from "./router";
import {
  createUser,
  getUser,
  getUserConversations,
  createConversation,
  removeConversation,
  getConversation,
  createConversationParticipant,
  getConversationParticipants,
  removeConversationParticipants,
  removeUser,
  ServiceProvider,
} from "./routes";
import { DdbConversationRepository, DdbUserRepository } from "../common/db";
import * as Params from "../common/params";

const router = mountRouter();

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2<APIGatewayProxyStructuredResultV2>> => {
  return await router.handle(event);
};

export function mountRouter(): ApiGatewayRouter<ServiceProvider> {
  const services = loadServices();
  const router = new ApiGatewayRouter(services);

  router
    .mount("POST", "/users", createUser)
    .mount("DELETE", "/users/{userId}", removeUser)
    .mount("GET", "/users/{userId}", getUser)
    .mount("GET", "/users/{userId}/conversations", getUserConversations)
    .mount("POST", "/conversations", createConversation)
    .mount("GET", "/conversations/{convoId}", getConversation)
    .mount("DELETE", "/conversations/{convoId}", removeConversation)
    .mount(
      "POST",
      "/conversations/{convoId}/participants",
      createConversationParticipant
    )
    .mount(
      "GET",
      "/conversations/{convoId}/participants",
      getConversationParticipants
    )
    .mount(
      "DELETE",
      "/conversations/{convoId}/participants/{userId}",
      removeConversationParticipants
    );
  return router;
}

export function loadServices(): ServiceProvider {
  const tableName = Params.getTableName();
  const docClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
  });
  const conversationRepo = new DdbConversationRepository({
    client: docClient,
    tableName,
  });

  const userRepo = new DdbUserRepository({ client: docClient, tableName });
  return {
    userRepo,
    conversationRepo,
  };
}
