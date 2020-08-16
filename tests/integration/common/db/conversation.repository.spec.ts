import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

import { DdbConversationRepository } from "../../../../src/common/db/conversation.repository";

import * as AWSTestUtils from "../../../helpers/aws-sdk";
import * as Constants from "../../../helpers/constants";
import { DdbUserRepository } from "../../../../src/common/db/user.repository";

describe("DdbConversationRepository integration with the database", () => {
  let userRepo: DdbUserRepository;
  let convoRepo: DdbConversationRepository;
  let tableName: string;
  let client: DocumentClient;

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

  it("when calling createConversation, creates a new conversation", async () => {
    // GIVEN
    const convoAttrs = { alias: "Me And My Friends" };

    // WHEN
    const out = await convoRepo.createConversation(convoAttrs);

    // THEN
    expect(out).toMatchObject(convoAttrs);
    expect(out.id).toBeDefined();
    expect(out.createdDate).toBeDefined();
    expect(out.updatedDate).toBeDefined();
    expect(out.updatedDate).toStrictEqual(out.createdDate);
  });

  it("when calling getConversation, you get a conversation", async () => {
    // GIVEN
    const actualConvo = await convoRepo.createConversation();

    // WHEN
    const expectedConvo = await convoRepo.getConversation(actualConvo.id);

    // THEN
    expect(expectedConvo).toMatchObject(actualConvo);
  });

  it("when calling createParticipant, adds a new participant", async () => {
    // GIVEN
    const user = await userRepo.createUser({
      email: "a@gmail.com",
      conversations: [],
    });

    // WHEN
    const convo = await convoRepo.createConversation();
    const out = await convoRepo.createParticipant(convo.id, user);

    // THEN
    expect(out).toMatchObject({
      convoId: convo.id,
      userId: user.id,
      email: user.email,
    });
    expect(out.createdDate).toBeDefined();
    expect(out.updatedDate).toBeDefined();
    expect(out.updatedDate).toStrictEqual(out.createdDate);
  });

  it("when calling removeParticipant, removes it", async () => {
    // GIVEN
    const user = await userRepo.createUser({
      email: "a@gmail.com",
      conversations: [],
    });
    const convo = await convoRepo.createConversation();
    const participant = await convoRepo.createParticipant(convo.id, user);

    // WHEN
    const removedParticipant = await convoRepo.removeParticipant(
      convo.id,
      user.id
    );

    // THEN
    expect(removedParticipant).toStrictEqual(participant);
  });

  it("createConnection registers the connection in the user object", async () => {
    // GIVEN
    const convo = await convoRepo.createConversation();
    const user = await userRepo.createUser({
      email: "a@gmail.com",
    });
    const originParticipant = await convoRepo.createParticipant(convo.id, user);

    // WHEN
    const participant = await convoRepo.createConnection({
      convoId: convo.id,
      userId: user.id,
      connId: "123",
    });

    // THEN
    expect(participant).toHaveProperty("connId");
  });

  it("removeConnection drops the connection in the user object", async () => {
    // GIVEN
    const convo = await convoRepo.createConversation();
    const user = await userRepo.createUser({
      email: "a@gmail.com",
    });
    await convoRepo.createParticipant(convo.id, user);
    await convoRepo.createConnection({
      convoId: convo.id,
      userId: user.id,
      connId: "123",
    });

    // WHEN
    const participant = await convoRepo.removeConnection({
      convoId: convo.id,
      userId: user.id,
    });

    // THEN
    expect(participant).not.toHaveProperty("connId");
  });
});
