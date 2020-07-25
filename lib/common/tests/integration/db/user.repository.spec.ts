import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DdbUserRepository } from "../../../common/db/user.repository";
import { PutItemInput, GetItemInput } from "aws-sdk/clients/dynamodb";

import * as AWSTestUtils from "../../helpers/aws-sdk";
import * as Constants from "../../helpers/constants";
import sinon from "sinon";

describe("DdbUserRepository", () => {
  beforeAll(async () => {
    const ddb = new AWS.DynamoDB({
      endpoint: "http://localhost:8000",
      apiVersion: "2012-08-10",
      region: "eu-west-2",
    });
    var params = {
      AttributeDefinitions: [
        {
          AttributeName: "HK",
          AttributeType: "S",
        },
        {
          AttributeName: "SK",
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: "HK",
          KeyType: "HASH",
        },
        {
          AttributeName: "SK",
          KeyType: "RANGE",
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      TableName: Constants.TABLE_NAME,
    };

    await ddb.createTable(params).promise();
  });
  afterAll(async () => {
    const ddb = new AWS.DynamoDB({
      endpoint: "http://localhost:8000",
      apiVersion: "2012-08-10",
      region: "eu-west-2",
    });
    await ddb.deleteTable({ TableName: Constants.TABLE_NAME }).promise();
  });

  const client = new DocumentClient({
    endpoint: "http://localhost:8000",
    apiVersion: "2012-08-10",
    region: "eu-west-2",
  });

  const repository = new DdbUserRepository({
    client,
    tableName: Constants.TABLE_NAME,
  });

  it("when calling createUser, creates a new user", async () => {
    // GIVEN
    const userIn = {
      email: "johnjohn@gmail.com",
    };

    // WHEN
    const userOut = await repository.createUser(userIn);

    // THEN
    expect(userOut).toMatchObject(userIn);
    expect(userOut.id).toBeDefined();
    expect(userOut.createdDate).toBeDefined();
    expect(userOut.updatedDate).toBeDefined();
    expect(userOut.updatedDate).toStrictEqual(userOut.createdDate);
  });

  it("when calling replaceUser, replace the user info", async () => {
    // GIVEN
    const userIn = {
      email: "johnjohn@gmail.com",
    };
    const { id: userId, ...dto } = await repository.createUser(userIn);
    const newEmail = "cheval@yahoo.fr";
    dto.email = newEmail;

    // WHEN
    const updatedUser = await repository.replaceUser(userId, dto);

    // then
    expect(updatedUser).toMatchObject({ id: userId, email: newEmail });
  });

  it("when calling replaceUser on a missing user, throws error", async () => {
    expect(
      repository.replaceUser("missingID", { email: "JohnJhon2" })
    ).rejects.toThrow();
  });

  it("when calling removeUser, removes the user from the database", async () => {
    // GIVEN
    const user = await repository.createUser({
      email: "johnjohn@gmail.com",
    });

    // WHEN
    const removedUser = await repository.removeUser(user.id);

    // THEN
    expect(removedUser).toStrictEqual(user);

    AWSMock.restore();
  });

  it("when calling removeUser on a missing user, throws error", async () => {
    expect(repository.removeUser("missingID")).rejects.toThrow();
  });
});
