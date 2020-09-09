import { AppError } from "../common/errors";
import {
  CreateUpdateUserDto,
  CreateUpdateConversationDto,
  UserRepository,
  ConversationRepository,
} from "../common/db/types";
import { Handler } from "./router";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ParticipantRole } from "../common/entities";
import { ServiceProvider } from "../common/services";

export type RequestHandler = Handler<ServiceProvider>;

export const createUser: RequestHandler = async (event, { userRepo }) => {
  if (!event.body) {
    throw new AppError(
      "InvalidRequestBody",
      400,
      "Body of request is empty",
      true
    );
  }

  const dto: CreateUpdateUserDto = deserializeJson(event.body);
  const item = await userRepo.createUser(dto);
  return { statusCode: 201, body: JSON.stringify(item) };
};

export const getUser: RequestHandler = async (event, { userRepo }) => {
  const userId = event.pathParameters!.userId;
  const user = await userRepo.getUser(userId);
  return { statusCode: 200, body: JSON.stringify(user) };
};

export const removeUser: RequestHandler = async (event, { userRepo }) => {
  const userId = event.pathParameters!.userId;
  const userConvos = await userRepo.getUserConversations(userId);
  const convoIds = await Promise.all(
    userConvos.map(async ({ userId, convoId }) => {
      await userRepo.removeUserConversation(userId, convoId);
      return convoId;
    })
  );
  const user = await userRepo.removeUser(userId);
  return { statusCode: 200, body: JSON.stringify({ user, convoIds }) };
};

export const getUserConversations: RequestHandler = async (
  event,
  { userRepo }
) => {
  const userId = event.pathParameters!.userId;
  const userConvos = await userRepo.getUserConversations(userId);
  return { statusCode: 200, body: JSON.stringify(userConvos) };
};

export const createConversation: RequestHandler = async (
  event,
  { userRepo, conversationRepo }
) => {
  if (!event.body) {
    throw new AppError(
      "InvalidRequestBody",
      400,
      "Body of request is empty",
      true
    );
  }
  const {
    participantIds = [],
    ...dto
  }: CreateUpdateConversationDto & {
    participantIds: string[];
  } = deserializeJson(event.body);
  const users = await Promise.all(
    participantIds.map(async (userId) => await userRepo.getUser(userId))
  );
  const conversation = await conversationRepo.createConversation(dto);
  const participants = await Promise.all(
    users.map(async (user) => {
      const participant = await conversationRepo.createParticipant(
        conversation.id,
        user,
        "administrator"
      );
      await userRepo.appendUserConversation(user.id, conversation.id);
      return participant;
    })
  );
  return {
    statusCode: 201,
    body: JSON.stringify({ conversation, participants }),
  };
};

export const getConversation: RequestHandler = async (
  event,
  { conversationRepo }: ServiceProvider
) => {
  const convoId = event.pathParameters!.convoId;
  const convo = await conversationRepo.getConversation(convoId);
  return { statusCode: 200, body: JSON.stringify(convo) };
};

export const removeConversation: RequestHandler = async (
  event,
  { conversationRepo }
) => {
  const convoId = event.pathParameters!.convoId;
  const convo = await conversationRepo.removeConversation(convoId);
  return { statusCode: 200, body: JSON.stringify(convo) };
};

export const createConversationParticipant: RequestHandler = async (
  event,
  { conversationRepo, userRepo }
) => {
  if (!event.body) {
    throw new AppError(
      "InvalidRequestBody",
      400,
      "Body of request is empty",
      true
    );
  }
  const {
    userId,
    role,
  }: { userId: string; role?: ParticipantRole } = deserializeJson(event.body);

  const user = await userRepo.getUser(userId);
  const convoId = event.pathParameters!.convoId;
  const participant = await conversationRepo.createParticipant(
    convoId,
    user,
    role
  );
  return { statusCode: 201, body: JSON.stringify(participant) };
};

export const getConversationParticipants: RequestHandler = async (
  event,
  { conversationRepo }
) => {
  const convoId = event.pathParameters!.convoId;
  const participants = await conversationRepo.getParticipants(convoId);
  return { statusCode: 200, body: JSON.stringify(participants) };
};

export const removeConversationParticipants: RequestHandler = async (
  event,
  { conversationRepo }
) => {
  const { convoId, userId } = event.pathParameters!;
  const participant = await conversationRepo.removeParticipant(convoId, userId);
  return { statusCode: 200, body: JSON.stringify(participant) };
};

const deserializeJson = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const { message } = error as SyntaxError;
    throw new AppError("InvalidJson", 400, message, true);
  }
};

const eventHasBody = (event: APIGatewayProxyEventV2): void => {
  if (!event.body) {
    throw new AppError(
      "InvalidRequestBody",
      400,
      "Body of request is empty",
      true
    );
  }
};
