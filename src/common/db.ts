import {
  UserRepository,
  CreateUpdateUserDto,
  ConversationRepository,
  AddConnectionOptions,
  GetEventsOptions,
} from "./db.types";
import { User, Participant, Conversation, Events } from "./entities";

export class DdbUserRepository implements UserRepository {
  getUser(userId: string): User {
    throw new Error("Method not implemented.");
  }
  removeUser(userId: string): void {
    throw new Error("Method not implemented.");
  }
  createUser(userDto: CreateUpdateUserDto): User {
    throw new Error("Method not implemented.");
  }
  updateUser(userDto: CreateUpdateUserDto): User {
    throw new Error("Method not implemented.");
  }
  getUserConversations(
    userid: string
  ): import("./entities").UserConversation[] {
    throw new Error("Method not implemented.");
  }
}

export class DdbConversationRepository implements ConversationRepository {
  createParticipant(convoId: string, user: User): Participant {
    throw new Error("Method not implemented.");
  }
  removeParticipant(convoId: string, userId: string): Participant {
    throw new Error("Method not implemented.");
  }
  createConnection(
    convoId: string,
    options: AddConnectionOptions
  ): Participant {
    throw new Error("Method not implemented.");
  }
  removeConnection(convoId: string, userId: string): Participant {
    throw new Error("Method not implemented.");
  }
  getParticipants(convoId: string): Participant[] {
    throw new Error("Method not implemented.");
  }
  createConversation(...users: User[]): [Conversation, Participant[]] {
    throw new Error("Method not implemented.");
  }
  getAllEvents(convoId: string): Events[keyof Events][] {
    throw new Error("Method not implemented.");
  }
  getEvents(
    convoId: string,
    options: GetEventsOptions
  ): Events[keyof Events][] {
    throw new Error("Method not implemented.");
  }
  appendEvent(convoId: string, event: Events[keyof Events]): void {
    throw new Error("Method not implemented.");
  }
}
