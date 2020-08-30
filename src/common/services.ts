import * as Params from "./params";
import { UserRepository, ConversationRepository } from "./db/types";
import AWS from "aws-sdk";
import { DdbConversationRepository, DdbUserRepository } from "./db";

export interface ServiceProvider {
  userRepo: UserRepository;
  conversationRepo: ConversationRepository;
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
