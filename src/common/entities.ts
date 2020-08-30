/**
 * A conversation between users.
 *
 * @export
 * @interface Conversation
 */
export interface Conversation {
  id: string;
  alias?: string;
  avatarUrl?: string;
  createdDate: Date;
  updatedDate: Date;
}

/**
 * A user of the application.
 *
 * @export
 * @interface User
 */
export interface User {
  id: string;
  email: string;
  alias?: string;
  avatarUrl?: string;
  createdDate: Date;
  updatedDate: Date;
  conversations: string[];
}

/**
 * Represents a user active in the conversation.
 * A non null connId indicates that the user is currently holding a websocket connection
 * and should receive any event currently broadcasted.
 *
 * @export
 * @interface Participant
 */
export interface Participant {
  convoId: string;
  userId: string;
  connId?: string;
  email: string;
  createdDate: Date;
  updatedDate: Date;
  role?: ParticipantRole;
}

export type ParticipantRole = "administrator" | "default";

/**
 * A reference to a conversation a user has joined.
 *
 * @export
 * @interface UserConversation
 */
export interface UserConversation {
  userId: string;
  convoId: string;
}

/**
 * Events happening withing a conversation
 */
export type Events = {
  joinConversation: JoinConversationEvent;
  leaveConversation: LeaveConversationEvent;
  sendAttachement: SendAttachementEvent;
  sendDirectMessage: SendDirectMessageEvent;
  sendMessage: SendMessageEvent;
};

export type Event = Events[keyof Events];

export interface EventBase {
  action: string;
  id?: string;
  timestamp: Date;
  userId: string;
  convoId: string;
}

export interface JoinConversationEvent extends EventBase {
  action: "joinConversation";
}

export interface LeaveConversationEvent extends EventBase {
  action: "leaveConversation";
}

export interface SendMessageEvent extends EventBase {
  action: "sendMessage";
  mediaUrl?: string;
  text: string;
}

export interface SendDirectMessageEvent extends EventBase {
  action: "sendDirectMessage";
  text: string;
  mediaUrl?: string;
  recipientId: string;
}

export interface SendAttachementEvent extends EventBase {
  action: "sendAttachement";
  text: string;
  attachmentUri: string;
}
