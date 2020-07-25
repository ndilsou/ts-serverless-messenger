import * as AWSMock from "aws-sdk-mock";

import * as sinon from 'sinon'
import { DdbUserRepository } from "./user.repository";
import { PutItemInput, GetItemInput } from "aws-sdk/clients/dynamodb";

import * as AWSTestUtils from "../test.helpers/aws-sdk";
import { AWSError } from "aws-sdk";

describe("DdbUserRepository", () => {
  afterEach(() => {
    AWSMock.restore();
  });

  it("reraise on AWS error", async () => {
    // GIVEN
    const userIn = {
      email: "johnjohn@gmail.com",
    };

    var spy = sinon.stub().throws(new Error("ERROR"));

    const client = AWSTestUtils.buildMockDocumentClient(
      "put",
      spy
    );

    const repository = new DdbUserRepository({
      client,
      tableName: "TEST_TABLE",
    });

    // THEN
    await expect(repository.createUser(userIn)).rejects.toThrow();
  });

  it("creates a new user", async () => {
    // GIVEN
    const userIn = {
      email: "johnjohn@gmail.com",
    };

    const client = new AWSTestUtils.MockDocumentClientBuilder().mock(
      "put",
      ({ Item: item }: PutItemInput, callback: Function) => {
        expect(item.email).toStrictEqual(userIn.email);
        callback(null, { $response: { error: null } });
      }
    ).build();

    const repository = new DdbUserRepository({
      client,
      tableName: "TEST_TABLE",
    });

    // WHEN
    const userOut = await repository.createUser(userIn);

    // THEN
    expect(userOut).toMatchObject(userIn);
    expect(userOut.id).toBeDefined();
    expect(userOut.createdDate).toBeDefined();
    expect(userOut.updatedDate).toBeDefined();
    expect(userOut.updatedDate).toStrictEqual(userOut.createdDate);
  });

  it("updates an existing user", () => {

    // GIVEN
    const originalUser = {
      email: "johnjohn@gmail.com",
    };

    var getStub = sinon.stub()
    const client = new AWSTestUtils.MockDocumentClientBuilder().mock(
      "get",
      ({ Key: key }: GetItemInput, callback: Function) => {
        expect(item.email).toStrictEqual(userIn.email);
        callback(null, { $response: { error: null } });
      }
    ).build();
  })
});
