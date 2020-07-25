import { UserRepository, CreateUpdateUserDto } from "./types";
import { User, UserConversation } from "../entities";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import * as DbUtils from "./utilities";

export interface DdbUserRepositoryProps {
  client: DocumentClient;
  tableName: string;
}

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
    const { PK: _pk, SK: _sk, ...userAttrs } = output.Item;

    return { ...userAttrs, id: userId } as User;
  }

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
    const { PK: _pk, SK: _sk, ...userAttrs } = output.Attributes;

    return { ...userAttrs, id: userId } as User;
  }

  async createUser(userDto: CreateUpdateUserDto): Promise<User> {
    const date = new Date();
    const id = DbUtils.generateId();
    const item = {
      ...userDto,
      HK: `USER#${id}`,
      SK: `USER#${id}`,
      createdDate: date.toISOString(),
      updatedDate: date.toISOString(),
    };
    await this.client.put({ TableName: this.tableName, Item: item }).promise();

    return {
      ...userDto,
      id,
      createdDate: date,
      updatedDate: date,
    };
  }

  async replaceUser(
    userId: string,
    userDto: CreateUpdateUserDto
  ): Promise<User> {
    const key = `USER#${userId}`;
    const primaryKey = { HK: key, SK: key };
    const output = await this.client
      .get({
        TableName: this.tableName,
        Key: primaryKey,
        ProjectionExpression: "CreatedDate",
      })
      .promise();
    if (!output.Item) {
      throw new Error("Missing User");
    }

    const updatedDate = new Date().toISOString();
    const { createdDate } = output.Item as { createdDate: string };
    const item = {
      ...userDto,
      ...primaryKey,
      createdDate,
      updatedDate,
    };
    await this.client.put({ TableName: this.tableName, Item: item }).promise();

    return {
      ...userDto,
      id: userId,
      createdDate: new Date(item.createdDate),
      updatedDate: new Date(item.updatedDate),
    };
  }

  // async updateUser(
  //   userId: string,
  //   userDto: CreateUpdateUserDto
  // ): Promise<User> {
  //   const date = new Date();
  //   const key = { HK: `USER#${userId}`, SK: `USER#${userId}` };
  //   const item = {
  //     ...userDto,
  //     updatedDate: date.toISOString(),
  //   };
  //   const expr = DbUtils.compileUpdateExpression(item);
  //   const response = await this.client
  //     .update({ TableName: this.tableName, Key: key, ...expr })
  //     .promise();

  //   return {
  //     ...userDto,
  //     id: userId,
  //     createdDate: date,
  //     updatedDate: date,
  //   };
  // }

  async getUserConversations(userid: string): Promise<UserConversation[]> {
    const keyConditionExpression = "";
    const { Items: items } = await this.client
      .query({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: {},
      })
      .promise();
    return items ? items.map((a) => a as UserConversation) : [];
  }
}
