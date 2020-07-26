import {
  ConversationRepository,
  AddConnectionProps,
  GetEventsOptions,
  CreateUpdateConversationDto,
} from "./types";
import {
  User,
  Participant,
  Conversation,
  Events,
  ParticipantRole,
} from "../entities";
import * as DbUtils from "./utilities";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { userInfo } from "os";

export interface DdbConversationRepositoryProps {
  client: DocumentClient;
  tableName: string;
}

export class DdbConversationRepository implements ConversationRepository {
  private readonly client: DocumentClient;
  private readonly tableName: string;
  constructor({ client, tableName }: DdbConversationRepositoryProps) {
    this.client = client;
    this.tableName = tableName;
  }

  async createParticipant(
    convoId: string,
    user: User,
    role?: ParticipantRole
  ): Promise<Participant> {
    const date = new Date();
    const id = DbUtils.generateId();
    const item = {
      HK: `CONVO#${convoId}`,
      SK: `USER#${user.id}`,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
      email: user.email,
      role,
    };
    await this.client.put({ TableName: this.tableName, Item: item }).promise();
    return {
      convoId,
      userId: user.id,
      email: user.email,
      role,
      createdDate: date,
      updatedDate: date,
    };
  }

  async removeParticipant(
    convoId: string,
    userId: string
  ): Promise<Participant> {
    throw new Error("Method not implemented.");
  }

  async getParticipants(convoId: string): Promise<Participant[]> {
    throw new Error("Method not implemented.");
  }

  async createConnection({
    connId,
    convoId,
    userId,
  }: AddConnectionProps): Promise<Participant> {
    const key = {
      HK: `CONVO#${convoId}`,
      SK: `USER#${userId}`,
    };
    const output = await this.client
      .update({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: "SET connId = :connId",
        ExpressionAttributeValues: { ":connId": connId },
        ReturnValues: "UPDATED_NEW",
      })
      .promise();
    const [_pk, attrs] = DbUtils.parseAttributes<
      Omit<Participant, "convoId" | "userId">
    >(output.Attributes as DbUtils.DynamoItem);

    return {
      convoId,
      userId,
      ...attrs,
    };
  }

  async removeConnection(
    convoId: string,
    userId: string
  ): Promise<Participant> {
    throw new Error("Method not implemented.");
  }

  async createConversation(
    convoDto?: CreateUpdateConversationDto
  ): Promise<Conversation> {
    const date = new Date();
    const id = DbUtils.generateId();
    const item = {
      ...convoDto,
      HK: `CONVO#${id}`,
      SK: `CONVO#${id}`,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
    };
    await this.client.put({ TableName: this.tableName, Item: item }).promise();
    return {
      ...convoDto,
      id,
      createdDate: date,
      updatedDate: date,
    };
  }

  async removeConversation(convoId: string): Promise<Conversation> {
    const key = {
      HK: `CONVO#${convoId}`,
      SK: `CONVO#${convoId}`,
    };
    const output = await this.client
      .delete({ Key: key, TableName: this.tableName, ReturnValues: "ALL_OLD" })
      .promise();

    if (!output.Attributes) {
      throw new Error(`No Conversation with id: ${convoId}`);
    }

    const [_pk, attrs] = DbUtils.parseAttributes<
      Omit<Participant, "convoId" | "userId">
    >(output.Attributes as DbUtils.DynamoItem);

    return {
      id: convoId,
      ...attrs,
    };
  }

  async getAllEvents(convoId: string): Promise<Events[keyof Events][]> {
    throw new Error("Method not implemented.");
  }

  async getEvents(
    convoId: string,
    options: GetEventsOptions
  ): Promise<Events[keyof Events][]> {
    throw new Error("Method not implemented.");
  }

  async appendEvent(
    convoId: string,
    event: Events[keyof Events]
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

const isUser = (userOrId: User | string): userOrId is User =>
  (userOrId as User).id !== undefined;
