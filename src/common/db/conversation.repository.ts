import {
  ConversationRepository,
  AddConnectionProps,
  GetEventsOptions,
  CreateUpdateConversationDto,
  RemoveConnectionProps,
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

type DdbConversationOutput = Omit<Conversation, "id"> & {
  conversations: DocumentClient.StringSet;
};

export interface DdbConversationRepositoryProps {
  client: DocumentClient;
  tableName: string;
}

export class DdbConversationRepository implements ConversationRepository {
  private readonly client: DocumentClient;
  private readonly tableName: string;
  private readonly hashLength: number = 16;

  constructor({ client, tableName }: DdbConversationRepositoryProps) {
    this.client = client;
    this.tableName = tableName;
  }

  async createParticipant(
    convoId: string,
    user: User,
    role: ParticipantRole = "default"
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
      createdDate: date,
      updatedDate: date,
      role,
    };
  }

  async removeParticipant(
    convoId: string,
    userId: string
  ): Promise<Participant> {
    const primaryKey = { HK: `CONVO#${convoId}`, SK: `USER#${userId}` };
    const output = await this.client
      .delete({
        TableName: this.tableName,
        Key: primaryKey,
        ReturnValues: "ALL_OLD",
      })
      .promise();
    if (!output.Attributes) {
      throw new Error("Missing User");
    }

    const [_pk, attrs] = DbUtils.parseAttributes<
      Omit<Participant, "convoId" | "userId">
    >(output.Attributes as DbUtils.DynamoItem);

    return {
      convoId,
      userId,
      ...attrs,
    };
  }

  async getParticipants(convoId: string): Promise<Participant[]> {
    const output = await this.client
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "HK = :hk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":hk": `CONVO#${convoId}`,
          ":sk": `USER#`,
        },
      })
      .promise();

    if (typeof output.Items === "undefined") {
      throw new Error(
        `Failed to load participants for conversation ${convoId}`
      );
    }

    const participants = output.Items.map((item) =>
      DbUtils.parseAttributes<Omit<Participant, "convoId" | "userId">>(
        item as DbUtils.DynamoItem
      )
    ).map(([pk, participant]) => {
      const userId = pk.SK.split("#")[1];
      return { convoId, userId, ...participant };
    });
    return participants;
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
        ConditionExpression: "HK = :hk and SK = :sk",
        ExpressionAttributeValues: {
          ":connId": connId,
          ":hk": key.HK,
          ":sk": key.SK,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    if (!output.Attributes) {
      throw new Error(
        `Missing participant ${userId} in conversation ${convoId}`
      );
    }
    const [_pk, attrs] = DbUtils.parseAttributes<
      Omit<Participant, "convoId" | "userId">
    >(output.Attributes as DbUtils.DynamoItem);

    return {
      convoId,
      userId,
      ...attrs,
    };
  }

  async removeConnection({
    convoId,
    userId,
  }: RemoveConnectionProps): Promise<Participant> {
    const key = {
      HK: `CONVO#${convoId}`,
      SK: `USER#${userId}`,
    };
    const output = await this.client
      .update({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: "REMOVE connId SET updatedDate = :u",
        ExpressionAttributeValues: {
          ":u": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
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

  async getConversation(convoId: string): Promise<Conversation> {
    const key = `CONVO#${convoId}`;
    const output = await this.client
      .get({ TableName: this.tableName, Key: { HK: key, SK: key } })
      .promise();
    if (!output.Item) {
      throw new Error("Missing Conversation");
    }

    const [_pk, attrs] = DbUtils.parseAttributes<Omit<Conversation, "id">>(
      output.Item as DbUtils.DynamoItem
    );

    return {
      id: convoId,
      ...attrs,
    };
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
    const primaryKey = {
      HK: `CONVO#${convoId}`,
      SK: `CONVO#${convoId}`,
    };
    const output = await this.client
      .delete({
        Key: primaryKey,
        TableName: this.tableName,
        ReturnValues: "ALL_OLD",
      })
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

  async appendEvent({
    action,
    timestamp,
    convoId,
    userId,
    ...data
  }: Events[keyof Events]): Promise<void> {
    const sortKey = `CONVO#${timestamp.toISOString()}`;
    const hash = DbUtils.hashSortKey(sortKey, this.hashLength);
    const date = new Date();
    const item = {
      HK: `CONVO#${convoId}.${hash}`,
      SK: sortKey,
      action,
      userId,
      data,
    };

    const output = await this.client
      .put({ TableName: this.tableName, Item: item })
      .promise();

    if (!output.Attributes) {
      throw new Error("Failed to insert the event");
    }
  }
}
