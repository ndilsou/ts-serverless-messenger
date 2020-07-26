// import "jest-dynalite/withDb";
import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DdbUserRepository } from "../../../common/db/user.repository";

import * as AWSTestUtils from "../../helpers/aws-sdk";
import * as Constants from "../../helpers/constants";
import { DdbConversationRepository } from "../../../common/db/conversation.repository";

describe("DdbUserRepository integration with the database", () => {
  let tableName: string;
  let client: DocumentClient;
  let userRepo: DdbUserRepository;
  let convoRepo: DdbConversationRepository;

  beforeEach(async () => {
    tableName = await AWSTestUtils.setupDdb();
    client = new DocumentClient(Constants.DDB_OPTIONS);

    console.log(`beforeEach: ${tableName}`);
    userRepo = new DdbUserRepository({
      client,
      tableName,
    });

    convoRepo = new DdbConversationRepository({
      client,
      tableName,
    });
  });
  afterEach(async () => await AWSTestUtils.teardownDDb(tableName));

  it("when calling createUser, creates a new user", async () => {
    // GIVEN
    const userIn = {
      email: "johnjohn@gmail.com",
    };
    console.log(Constants.DDB_OPTIONS);
    const ddb = new AWS.DynamoDB(Constants.DDB_OPTIONS);
    console.log(await ddb.listTables().promise());
    // WHEN
    const userOut = await userRepo.createUser(userIn);

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
    const { id: userId, ...dto } = await userRepo.createUser(userIn);
    const newEmail = "cheval@yahoo.fr";
    dto.email = newEmail;
    console.log(Constants.DDB_OPTIONS);
    const ddb = new AWS.DynamoDB(Constants.DDB_OPTIONS);
    console.log(await ddb.listTables().promise());

    // WHEN
    console.log(`replaceUser: ${tableName}`);
    const updatedUser = await userRepo.replaceUser(userId, dto);

    // THEN
    expect(updatedUser).toMatchObject({ id: userId, email: newEmail });
  });

  it("when calling replaceUser on a missing user, throws error", async () => {
    expect(
      userRepo.replaceUser("missingID", { email: "JohnJhon2" })
    ).rejects.toThrow();
  });

  it("when calling removeUser, removes the user from the database", async () => {
    // GIVEN
    const user = await userRepo.createUser({
      email: "johnjohn@gmail.com",
    });
    console.log(Constants.DDB_OPTIONS);
    const ddb = new AWS.DynamoDB(Constants.DDB_OPTIONS);
    console.log(await ddb.listTables().promise());

    // WHEN
    const removedUser = await userRepo.removeUser(user.id);

    // THEN
    expect(removedUser).toStrictEqual(user);
  });

  it("when calling removeUser on a missing user, throws error", async () => {
    expect(userRepo.removeUser("missingID")).rejects.toThrow();
  });
});
// });
