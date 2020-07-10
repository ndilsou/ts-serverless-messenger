export interface Conversation {
  id: string;
}

export type Event =
  | JoinConversationEvent
  | LeaveConversationEvent  
  | SendAttachementEvent
  | SendDirectMessageEvent
  | SendMessageEvent;

export interface EventBase {
  action: string;
  id?: string;
  timestamp: Date;
  userId: string;
}

export interface JoinConversationEvent extends EventBase {
  action: "joinConversation";
}

export interface LeaveConversationEvent extends EventBase {
  action: "leaveConversation";
}

export interface SendMessageEvent extends EventBase {
  action: "sendMessage";
  text: string;
}

export interface SendDirectMessageEvent extends EventBase {
  action: "sendDirectMessage";
  text: string;
  recipientId: string;
}

export interface SendAttachementEvent extends EventBase {
  action: "sendAttachement";
  text: string;
  attachmentUri: string;
}
