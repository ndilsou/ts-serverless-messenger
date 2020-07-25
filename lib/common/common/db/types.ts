import {
  User,
  UserConversation,
  Participant,
  Events,
  Conversation,
  EventBase,
} from "../entities";

export type CreateUpdateUserDto = {
  email: string;
  avatarUrl?: string;
  alias?: string;
};

export interface UserRepository {
  getUser(userId: string): Promise<User>;
  removeUser(userId: string): Promise<User>;
  createUser(userDto: CreateUpdateUserDto): Promise<User>;
  replaceUser(userId: string, userDto: CreateUpdateUserDto): Promise<User>;
  // updateUser(userId: string, userDto: CreateUpdateUserDto): Promise<User>;
  getUserConversations(userid: string): Promise<UserConversation[]>;
}

export type AddConnectionOptions = {
  userId: string;
  connId: string;
};

export type GetEventsOptions = {
  after?: Date;
  before?: Date;
  limit?: number;
};

export interface ConversationRepository {
  createParticipant(convoId: string, user: User): Promise<Participant>;
  removeParticipant(convoId: string, userId: string): Promise<Participant>;
  createConnection(
    convoId: string,
    options: AddConnectionOptions
  ): Promise<Participant>;
  removeConnection(convoId: string, userId: string): Promise<Participant>;
  getParticipants(convoId: string): Promise<Participant[]>;
  createConversation(...users: User[]): Promise<[Conversation, Participant[]]>;
  // Not sure it can handle multiple types. Maybe working with EventBase is better.
  getAllEvents(convoId: string): Promise<Events[keyof Events][]>;
  getEvents(
    convoId: string,
    options: GetEventsOptions
  ): Promise<Events[keyof Events][]>;
  appendEvent(convoId: string, event: Events[keyof Events]): Promise<void>;
}
