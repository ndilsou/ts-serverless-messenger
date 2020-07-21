### Entities:

#### Conversation: 
central element of the messaging experience.

**Attributes**:
* id
* events (RELATION)
  * Get all Events
* activeConnections (RELATION)
  * Get All active connection.
* participants (RELATION)
  * Get All participants of the conversation.


#### ActiveConnection: 
Identify a websocket connection to broadcast events to. 

**Attributes**:
* id
* conversation (RELATION)
* user (RELATION)


#### Event: 
All events happening in the convo. From user joining/leaving to new message coming in, or attachement being added to the convo. All ordered by time. Can be used to rebuild the history of the conversation.

**Attributes**:
* id
* action: define what the event represent for the convo.
* timestamp
* conversation (RELATION)
* user (RELATION)


#### User: 
User generate events as part of a conversation.

**Attributes**:
* id
* password
* username
* conversations (RELATION)
  * Get All conversation for a user
  * add another user to a conversation
  * leave a conversation
* events (RELATION)


### Operations:
* invite a user to a convo - REST
    Create Participant item for an existing user + Create a Connection
* remove a user from a convo - REST
    Delete User item + Drop a Connection
* send an event (message or else) to a convo - WS
    Write event, broadcast to all Connections
* get all the messages in a convo - REST
    Get all Events
* get N latest messages in a convo - REST
    Get all Events, Sort by datetime prefix, limit to N.
* sent a message with an attachement - WS
    Write event with Payload ref and write payload to S3. Link to payload in S3 in UI.
* send a response to a specific message - WS
    Write an event with a ref to another user. If user in active connections, UI handle notification. Else, use notification service (??)
* create a user - REST
    Create a user item.
* list all conversations of a user - REST.
    Get All UserConversations for a userId
* Get all events since user was last active:
    On disconnect, log the timestamp. When user receives a new connId, send the last active time back to allow a N latest query on events. Use this to populate the UI and flash on any direct mention.
* Handle offline notifications:
    If event ref a user that has no active connection, add a notification item instead. Once user is active again, return all it's notifications and delete them.
* log a user in - Cognito


