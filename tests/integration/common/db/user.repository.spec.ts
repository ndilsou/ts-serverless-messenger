// import "jest-dynalite/withDb";
import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DdbUserRepository } from "../../../../src/common/db/user.repository";

import * as AWSTestUtils from "../../../helpers/aws-sdk";
import * as Constants from "../../../helpers/constants";
import { DdbConversationRepository } from "../../../../src/common/db/conversation.repository";

describe("DdbUserRepository integration with the database", () => {
  let tableName: string;
  let client: DocumentClient;
  let userRepo: DdbUserRepository;
  let convoRepo: DdbConversationRepository;

  beforeEach(async () => {
    tableName = await AWSTestUtils.setupDdb();
    client = new DocumentClient(Constants.DDB_OPTIONS);

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

    // WHEN
    const updatedUser = await userRepo.replaceUser(userId, dto);

    // THEN
    expect(updatedUser).toMatchObject({ id: userId, email: newEmail });
  });

  it("when calling replaceUser on a missing user, throws error", async () => {
    expect(
      userRepo.replaceUser("missingID", {
        email: "JohnJhon2",
      })
    ).rejects.toThrow();
  });

  it("when calling removeUser, removes the user from the database", async () => {
    // GIVEN
    const user = await userRepo.createUser({
      email: "johnjohn@gmail.com",
    });

    // WHEN
    const removedUser = await userRepo.removeUser(user.id);

    // THEN
    expect(removedUser).toStrictEqual(user);
  });

  it("when calling removeUser on a missing user, throws error", async () => {
    expect(userRepo.removeUser("missingID")).rejects.toThrow();
  });

  it("when adding a new conversation to a user, gets the userConvo", async () => {
    // GIVEN
    const user = await userRepo.createUser({
      email: "johnjohn@gmail.com",
    });

    // WHEN
    const userConvo = await userRepo.appendUserConversation(user.id, "123");

    // THEN
    expect(userConvo).toMatchObject({ userId: user.id, convoId: "123" });
  });

  it("when adding a new conversation to a user, ignores duplicates", async () => {
    // GIVEN
    const { id } = await userRepo.createUser({
      email: "johnjohn@gmail.com",
    });
    const userConvo = await userRepo.appendUserConversation(id, "123");

    // WHEN
    await userRepo.appendUserConversation(id, "123");
    const user = await userRepo.getUser(id);

    // THEN
    expect(user.conversations.length).toStrictEqual(1);
  });

  it("when asking for the conversations of a user, gets the list of UserConversation", async () => {
    // GIVEN
    const { id } = await userRepo.createUser({
      email: "johnjohn@gmail.com",
    });

    const userConvo = await userRepo.appendUserConversation(id, "123");

    // WHEN
    const userConvos = await userRepo.getUserConversations(id);

    // THEN
    expect(userConvos).toStrictEqual([userConvo]);
  });

  it("can remove conversations from a user", async () => {
    // GIVEN
    const { id } = await userRepo.createUser({
      email: "johnjohn@gmail.com",
      conversations: ["123", "456"],
    });

    // WHEN
    await userRepo.removeUserConversation(id, "123");
    const userConvos = await userRepo.getUserConversations(id);

    // THEN
    expect(userConvos.length).toStrictEqual(1);
  });
});
