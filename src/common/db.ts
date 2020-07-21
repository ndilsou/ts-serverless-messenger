import {
  User,
  UserConversation,
  Participant,
  Events,
  Conversation,
} from "./entities";

export type CreateUpdateUserDto = {
  email: string;
  avatarUrl?: string;
  alias?: string;
};

export interface UserRepository {
  getUser(userId: string): User;
  removeUser(userId: string): void;
  createUser(userDto: CreateUpdateUserDto): User;
  updateUser(userDto: CreateUpdateUserDto): User;
  getUserConversations(userid: string): UserConversation[];
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
  createParticipant(convoId: string, user: User): Participant;
  removeParticipant(convoId: string, userId: string): Participant;
  createConnection(convoId: string, options: AddConnectionOptions): Participant;
  removeConnection(convoId: string, userId: string): Participant;
  getParticipants(convoId: string): Participant[];
  createConversation(...users: User[]): [Conversation, Participant[]];
  // Not sure it can handle multiple types. Maybe working with EventBase is better.
  getAllEvents<K extends keyof Events>(convoId: string): Events[K][];
  getEvents<K extends keyof Events>(
    convoId: string,
    options: GetEventsOptions
  ): Events[K][];
  appendEvent<K extends keyof Events>(convoId: string, event: Events[K]): void;
}
