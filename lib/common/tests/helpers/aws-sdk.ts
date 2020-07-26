import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import * as Constants from './constants'
import { makeId } from "./utilities";

export const buildMockDocumentClient = (
  method: keyof DocumentClient,
  replace: any
): DocumentClient => {
  AWSMock.setSDKInstance(AWS);
  AWSMock.mock("DynamoDB.DocumentClient", method, replace);

  return new DocumentClient({
    apiVersion: "2012-08-10",
    region: "eu-west-2",
  });
};

export class MockDocumentClientBuilder {
  endpoint: string;
  region: string;
  constructor({ endpoint, region } = { endpoint: "http://localhost:8000", region: "eu-west-2" }) {
    this.endpoint = endpoint;
    this.region = region;
    AWSMock.setSDKInstance(AWS);
  }

  public mock(
    method: keyof DocumentClient,
    replace: any
  ): MockDocumentClientBuilder {
    AWSMock.mock("DynamoDB.DocumentClient", method, replace);
    return this;
  }
  /**
   * returns the built mocked client
   */
  public build(): DocumentClient {
    return new DocumentClient({
      apiVersion: "2012-08-10",
      region: this.region,
      endpoint: this.endpoint,
    });
  }
}

export const setupDdb = async (tableName?: string): Promise<string> => {
  tableName = makeId(6)
  console.log(tableName)
  const ddb = new AWS.DynamoDB(Constants.DDB_OPTIONS);
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
    TableName: tableName,
  };

  await ddb.createTable(params).promise();
  return tableName
}

export const teardownDDb = async (tableName: string) => {
  const ddb = new AWS.DynamoDB(Constants.DDB_OPTIONS);
  await ddb.deleteTable({ TableName: tableName }).promise();
}
