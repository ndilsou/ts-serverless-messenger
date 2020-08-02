import {
  User,
  UserConversation,
  Participant,
  Events,
  Conversation,
  ParticipantRole,
} from "../entities";

export type CreateUpdateUserDto = {
  email: string;
  conversations?: string[];
  avatarUrl?: string;
  alias?: string;
};

export interface UserRepository {
  getUser(userId: string): Promise<User>;
  removeUser(userId: string): Promise<User>;
  createUser(userDto: CreateUpdateUserDto): Promise<User>;
  replaceUser(userId: string, userDto: CreateUpdateUserDto): Promise<User>;
  getUserConversations(userid: string): Promise<UserConversation[]>;
  appendUserConversation(
    userId: string,
    convoId: string
  ): Promise<UserConversation>;
  removeUserConversation(
    userId: string,
    convoId: string
  ): Promise<UserConversation>;
}

export type AddConnectionProps = {
  convoId: string;
  userId: string;
  connId: string;
};

export type GetEventsOptions = {
  after?: Date;
  before?: Date;
  limit?: number;
};

export type CreateUpdateConversationDto = {
  alias?: string;
  avatarUrl?: string;
};

export interface ConversationRepository {
  createParticipant(
    convoId: string,
    user: User,
    role?: ParticipantRole
  ): Promise<Participant>;
  getParticipants(convoId: string): Promise<Participant[]>;
  removeParticipant(convoId: string, userId: string): Promise<Participant>;
  createConnection(props: AddConnectionProps): Promise<Participant>;
  removeConnection(convoId: string, userId: string): Promise<Participant>;
  createConversation(
    convoDto?: CreateUpdateConversationDto
  ): Promise<Conversation>;
  removeConversation(convoId: string): Promise<Conversation>;
  // Not sure it can handle multiple types. Maybe working with EventBase is better.
  getAllEvents(convoId: string): Promise<Events[keyof Events][]>;
  getEvents(
    convoId: string,
    options: GetEventsOptions
  ): Promise<Events[keyof Events][]>;
  appendEvent(event: Events[keyof Events]): Promise<void>;
}
