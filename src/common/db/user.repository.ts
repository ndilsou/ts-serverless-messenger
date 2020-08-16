import { UserRepository, CreateUpdateUserDto } from "./types";
import { User, UserConversation } from "../entities";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as DbUtils from "./utilities";

export interface DdbUserRepositoryProps {
  client: DocumentClient;
  tableName: string;
}
type DdbCreateUpdateUserInput = Omit<CreateUpdateUserDto, "conversations"> &
  DbUtils.DynamoItem & { conversations?: DocumentClient.DynamoDbSet };

type DdbUserOutput = Omit<User, "id" | "conversations"> & {
  conversations: DocumentClient.StringSet;
};

export class DdbUserRepository implements UserRepository {
  private readonly client: DocumentClient;
  private readonly tableName: string;
  constructor({ client, tableName }: DdbUserRepositoryProps) {
    this.client = client;
    this.tableName = tableName;
  }

  async getUser(userId: string): Promise<User> {
    const key = `USER#${userId}`;
    const output = await this.client
      .get({ TableName: this.tableName, Key: { HK: key, SK: key } })
      .promise();
    if (!output.Item) {
      throw new Error("Missing User");
    }

    const [_pk, { conversations, ...attrs }] = DbUtils.parseAttributes<
      DdbUserOutput
    >(output.Item as DbUtils.DynamoItem);

    return {
      ...attrs,
      id: userId,
      conversations: conversations ? conversations.values : [],
    };
  }

  // async getUserByEmail(email: string): Promise<User> {
  //   // const key = `USER#${mail}`;
  //   const output = await this.client
  //     .query({
  //       TableName: this.tableName,
  //       IndexName: "GS1",
  //       KeyConditionExpression: "GS1 = :email",
  //       ExpressionAttributeValues: {
  //         ":email": email,
  //       },
  //       Limit: 1,
  //     })
  //     .promise();
  //   if (!output.Item) {
  //     throw new Error("Missing User");
  //   }

  //   const [_pk, { conversations, ...attrs }] = DbUtils.parseAttributes<
  //     DdbUserOutput
  //   >(output.Item as DbUtils.DynamoItem);

  //   return {
  //     ...attrs,
  //     id: userId,
  //     conversations: conversations ? conversations.values : [],
  //   };
  // }

  async removeUser(userId: string): Promise<User> {
    const key = `USER#${userId}`;
    const output = await this.client
      .delete({
        TableName: this.tableName,
        Key: { HK: key, SK: key },
        ReturnValues: "ALL_OLD",
      })
      .promise();
    if (!output.Attributes) {
      throw new Error("Missing User");
    }

    const [_pk, { conversations, ...attrs }] = DbUtils.parseAttributes<
      DdbUserOutput
    >(output.Attributes as DbUtils.DynamoItem);

    return {
      ...attrs,
      id: userId,
      conversations: conversations ? conversations.values : [],
    };
  }

  async createUser({
    conversations = [],
    ...userDto
  }: CreateUpdateUserDto): Promise<User> {
    const date = new Date();
    const id = DbUtils.generateId();
    let item: DdbCreateUpdateUserInput = {
      ...userDto,
      HK: `USER#${id}`,
      SK: `USER#${id}`,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
    };
    if (conversations.length > 0) {
      item = { ...item, conversations: this.client.createSet(conversations) };
    }
    await this.client.put({ TableName: this.tableName, Item: item }).promise();

    return {
      ...userDto,
      conversations,
      id,
      createdDate: date,
      updatedDate: date,
    };
  }

  async replaceUser(
    userId: string,
    { conversations = [], ...userDto }: CreateUpdateUserDto
  ): Promise<User> {
    const key = `USER#${userId}`;
    const primaryKey = { HK: key, SK: key };
    const output = await this.client
      .get({
        TableName: this.tableName,
        Key: primaryKey,
        ProjectionExpression: "createdDate",
      })
      .promise();
    if (!output.Item) {
      throw new Error("Missing User");
    }

    const createdDate = new Date(output.Item.createdDate as string);
    const updatedDate = new Date();
    let item: DdbCreateUpdateUserInput = {
      ...userDto,
      ...primaryKey,
      createdDate: createdDate.toISOString(),
      updatedDate: updatedDate.toISOString(),
    };

    if (conversations.length > 0) {
      item = { ...item, conversations: this.client.createSet(conversations) };
    }
    await this.client.put({ TableName: this.tableName, Item: item }).promise();

    return {
      ...userDto,
      id: userId,
      conversations,
      createdDate,
      updatedDate,
    };
  }

  async getUserConversations(userId: string): Promise<UserConversation[]> {
    const key = `USER#${userId}`;
    const output = await this.client
      .get({
        TableName: this.tableName,
        Key: { HK: key, SK: key },
        ProjectionExpression: "conversations",
      })
      .promise();
    if (!output.Item) {
      throw new Error("Missing User");
    }
    const { conversations } = output.Item as {
      conversations: DocumentClient.StringSet;
    };

    return conversations
      ? conversations.values.map((convoId) => ({ convoId, userId }))
      : [];
  }

  async appendUserConversation(
    userId: string,
    convoId: string
  ): Promise<UserConversation> {
    const date = new Date();
    const key = `USER#${userId}`;
    await this.client
      .update({
        TableName: this.tableName,
        Key: { HK: key, SK: key },
        UpdateExpression: "ADD conversations :c SET updatedDate = :u",
        ExpressionAttributeValues: {
          ":c": this.client.createSet([convoId]),
          ":u": date.toISOString(),
        },
      })
      .promise();

    return {
      convoId,
      userId,
    };
  }

  async removeUserConversation(
    userId: string,
    convoId: string
  ): Promise<UserConversation> {
    const date = new Date();
    const key = `USER#${userId}`;
    await this.client
      .update({
        TableName: this.tableName,
        Key: { HK: key, SK: key },
        UpdateExpression: "DELETE conversations :c SET updatedDate = :u",
        ExpressionAttributeValues: {
          ":c": this.client.createSet([convoId]),
          ":u": date.toISOString(),
        },
      })
      .promise();

    return {
      convoId,
      userId,
    };
  }
}
