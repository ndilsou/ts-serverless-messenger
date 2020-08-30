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
  ParticipantRole,
  Event,
} from "../entities";
import * as DbUtils from "./utilities";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AppError } from "../errors";

type DdbConversationOutput = Omit<Conversation, "id"> & {
  conversations: DocumentClient.StringSet;
};

export interface DdbConversationRepositoryProps {
  client: DocumentClient;
  tableName: string;
}

export interface GetEventPartitionParams {
  convoId: string;
  partition: number;
  options: GetEventsOptions;
}

export class DdbConversationRepository implements ConversationRepository {
  private readonly client: DocumentClient;
  private readonly tableName: string;
  private readonly numParts: number = 16;

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
      HK: `CONVO:id#${convoId}`,
      SK: `USER:id#${user.id}`,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
      userId: user.id,
      email: user.email,
      convoId,
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
    const primaryKey = { HK: `CONVO:id#${convoId}`, SK: `USER:id#${userId}` };
    const output = await this.client
      .delete({
        TableName: this.tableName,
        Key: primaryKey,
        ReturnValues: "ALL_OLD",
      })
      .promise();
    if (!output.Attributes) {
      throw new AppError(
        "RecordNotFound",
        404,
        `No participant with id ${userId} in conversation${convoId}`,
        true
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

  async getParticipants(convoId: string): Promise<Participant[]> {
    const output = await this.client
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "HK = :hk and begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":hk": `CONVO:id#${convoId}`,
          ":sk": `USER:id#`,
        },
      })
      .promise();

    if (typeof output.Items === "undefined") {
      throw new AppError(
        "RecordNotFound",
        404,
        `Failed to load participants for conversation ${convoId}`,
        true
      );
    }

    const participants = output.Items.map((item) =>
      DbUtils.parseAttributes<Participant>(item as DbUtils.DynamoItem)
    ).map(([pk, participant]) => {
      return participant;
    });
    return participants;
  }

  async createConnection({
    connId,
    convoId,
    userId,
  }: AddConnectionProps): Promise<Participant> {
    const key = {
      HK: `CONVO:id#${convoId}`,
      SK: `USER:id#${userId}`,
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
      throw new AppError(
        "RecordNotFound",
        404,
        `Missing participant ${userId} in conversation ${convoId}`,
        true
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
      HK: `CONVO:id#${convoId}`,
      SK: `USER:id#${userId}`,
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
    const key = `CONVO:id#${convoId}`;
    const output = await this.client
      .get({ TableName: this.tableName, Key: { HK: key, SK: key } })
      .promise();
    if (!output.Item) {
      throw new AppError(
        "RecordNotFound",
        404,
        `Missing Conversation with id ${convoId}`,
        true
      );
    }

    const [_pk, convo] = DbUtils.parseAttributes<Conversation>(
      output.Item as DbUtils.DynamoItem
    );

    return convo;
  }

  async createConversation(
    convoDto?: CreateUpdateConversationDto
  ): Promise<Conversation> {
    const date = new Date();
    const id = DbUtils.generateId();
    const item = {
      ...convoDto,
      HK: `CONVO:id#${id}`,
      SK: `CONVO:id#${id}`,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
      id,
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
      HK: `CONVO:id#${convoId}`,
      SK: `CONVO:id#${convoId}`,
    };
    const output = await this.client
      .delete({
        Key: primaryKey,
        TableName: this.tableName,
        ReturnValues: "ALL_OLD",
      })
      .promise();

    if (!output.Attributes) {
      throw new AppError(
        "RecordNotFound",
        404,
        `No Conversation with id: ${convoId}`,
        true
      );
    }

    const [_pk, attrs] = DbUtils.parseAttributes<
      Omit<Participant, "convoId" | "userId">
    >(output.Attributes as DbUtils.DynamoItem);

    return {
      id: convoId,
      ...attrs,
    };
  }

  async getAllEvents(convoId: string): Promise<Event[]> {
    throw new Error("Method not implemented.");
  }

  private async getEventPartition({
    partition,
    convoId,
    options,
  }: GetEventPartitionParams): Promise<Event[]> {
    // TODO deal with pagination
    const result = await this.client
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "HK = :hk",
        ExpressionAttributeValues: {
          ":hk": `CONVO:id#${convoId}#HASH.${partition}`,
        },
      })
      .promise();
    if (!result.Items) {
      throw new AppError(
        "RecordNotFound",
        404,
        `Missing Conversation with id ${convoId}`,
        true
      );
    }
    const events = result.Items.map((item) => {
      const { HK: _hk, SK: _sk, ...attrs } = item;
      return attrs as Event;
    });
    return events;
  }

  async getEvents(
    convoId: string,
    options: GetEventsOptions
  ): Promise<Event[]> {
    const parts = new Array(this.numParts).fill(undefined).map((_, i) => i);
    // TODO: handle failure of getEventPartition
    const eventsPerPartition = await Promise.all(
      parts.map(
        async (partition: number) =>
          await this.getEventPartition({ convoId, partition, options })
      )
    );
    const events = ([] as Event[]).concat(...eventsPerPartition);

    return events;
  }

  async appendEvent({
    action,
    timestamp,
    convoId,
    userId,
    ...data
  }: Event): Promise<void> {
    const sortKey = `EVENT:timestamp#${timestamp.toISOString()}`;
    const hash = DbUtils.hashSortKey(sortKey, this.numParts);
    const date = new Date();
    const item = {
      HK: `CONVO:id#${convoId}#PART.${hash}`,
      SK: sortKey,
      action,
      userId,
      data,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
    };

    const output = await this.client
      .put({ TableName: this.tableName, Item: item })
      .promise();

    if (!output.Attributes) {
      throw new AppError(
        "FailedInsert",
        500,
        "Failed to insert the event",
        false
      );
    }
  }
}
