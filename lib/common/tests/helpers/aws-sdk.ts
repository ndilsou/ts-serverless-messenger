import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { PutItemInput, DocumentClient } from "aws-sdk/clients/dynamodb";

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
