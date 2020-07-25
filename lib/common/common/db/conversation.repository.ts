import {
  ConversationRepository,
  AddConnectionOptions,
  GetEventsOptions,
} from "./types";
import { User, Participant, Conversation, Events } from "../entities";

export class DdbConversationRepository implements ConversationRepository {
  async createParticipant(convoId: string, user: User): Promise<Participant> {
    throw new Error("Method not implemented.");
  }

  async removeParticipant(convoId: string, userId: string): Promise<Participant> {
    throw new Error("Method not implemented.");
  }

  async createConnection(
    convoId: string,
    options: AddConnectionOptions
  ): Promise<Participant> {
    throw new Error("Method not implemented.");
  }

  async removeConnection(convoId: string, userId: string): Promise<Participant> {
    throw new Error("Method not implemented.");
  }

  async getParticipants(convoId: string): Promise<Participant[]> {
    throw new Error("Method not implemented.");
  }

  async createConversation(...users: User[]): Promise<[Conversation, Participant[]]> {
    throw new Error("Method not implemented.");
  }

  async getAllEvents(convoId: string): Promise<Events[keyof Events][]> {
    throw new Error("Method not implemented.");
  }

  async getEvents(
    convoId: string,
    options: GetEventsOptions
  ): Promise<Events[keyof Events][]> {
    throw new Error("Method not implemented.");
  }

  async appendEvent(convoId: string, event: Events[keyof Events]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
