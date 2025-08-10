# WhatsApp Webhook Payload Processing

This document explains how the system processes WhatsApp webhook payloads for real-time messaging.

## Supported Payload Structure

The system supports the following WhatsApp webhook payload formats:

### 1. Message Payload
```json
{
  "payload_type": "whatsapp_webhook",
  "_id": "conv1-msg2-api",
  "metaData": {
    "entry": [
      {
        "changes": [
          {
            "field": "messages",
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "918329446654",
                "phone_number_id": "629305560276479"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "Ravi Kumar"
                  },
                  "wa_id": "919937320320"
                }
              ],
              "messages": [
                {
                  "from": "918329446654",
                  "id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=",
                  "timestamp": "1754400020",
                  "text": {
                    "body": "Hi Ravi! Sure, I'd be happy to help you with that."
                  },
                  "type": "text"
                }
              ]
            }
          }
        ],
        "id": "30164062719905278"
      }
    ],
    "gs_app_id": "conv1-app",
    "object": "whatsapp_business_account"
  },
  "createdAt": "2025-08-06 12:00:20",
  "startedAt": "2025-08-06 12:00:20",
  "completedAt": "2025-08-06 12:00:21",
  "executed": true
}
```

### 2. Status Update Payload
```json
{
  "payload_type": "whatsapp_webhook",
  "_id": "conv1-msg2-status",
  "metaData": {
    "entry": [
      {
        "changes": [
          {
            "field": "messages",
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "918329446654",
                "phone_number_id": "629305560276479"
              },
              "statuses": [
                {
                  "conversation": {
                    "id": "conv1-convo-id",
                    "origin": {
                      "type": "user_initiated"
                    }
                  },
                  "gs_id": "conv1-msg2-gs-id",
                  "id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=",
                  "meta_msg_id": "wamid.HBgMOTE5OTY3NTc4NzIwFQIAEhggNDc4NzZBQ0YxMjdCQ0VFOTk2NzA3MTI4RkZCNjYyMjc=",
                  "recipient_id": "919937320320",
                  "status": "read",
                  "timestamp": "1754400040"
                }
              ]
            }
          }
        ],
        "id": "30164062719905278"
      }
    ],
    "gs_app_id": "conv1-app",
    "object": "whatsapp_business_account",
    "startedAt": "2025-08-06 12:00:40",
    "completedAt": "2025-08-06 12:00:40",
    "executed": true
  }
}
```

## Processing Flow

### 1. Webhook Endpoint
- **URL**: `POST /webhook`
- **Content-Type**: `application/json`
- **Payload Limit**: 10MB (configurable)

### 2. Payload Validation
The system validates the payload structure:
- Checks for `payload_type: "whatsapp_webhook"`
- Validates `metaData.entry[0].changes[0].value` structure
- Ensures either `messages` or `statuses` arrays exist

### 3. Message Processing
For each message in the payload:
- Extracts message details (from, to, text, timestamp, id)
- Finds corresponding contact information
- Checks for duplicate messages using `messageId`
- Creates new message record in database
- Emits real-time updates via Socket.io

### 4. Status Update Processing
For each status update:
- Extracts status information (`meta_msg_id`, `status`)
- Updates existing message status in database
- Emits real-time status updates via Socket.io

## Database Schema

### Message Model
```javascript
{
  from: String,           // Sender phone number
  to: String,             // Recipient phone number
  text: String,           // Message content
  timestamp: Date,        // Message timestamp
  status: String,         // 'sent', 'delivered', 'read'
  senderName: String,     // Sender's display name
  messageId: String       // Unique WhatsApp message ID
}
```

## Real-time Updates

### Socket.io Events
- **`message`**: New message received
- **`messageStatusUpdated`**: Message status changed

### Client Integration
The frontend automatically receives real-time updates:
- New messages appear instantly
- Message status updates (read receipts)
- Conversation list updates

## Error Handling

### Validation Errors
- Invalid payload structure
- Missing required fields
- Duplicate message IDs

### Processing Errors
- Database connection issues
- Socket.io connection problems
- Memory/performance issues

## Testing

### Test Script
Run the test script to verify payload processing:
```bash
cd server
node test-payload.js
```

### Manual Testing
Send test payloads to the webhook endpoint:
```bash
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

## Production Considerations

### 1. Security
- Implement webhook signature verification
- Rate limiting for webhook endpoints
- IP whitelisting for WhatsApp servers

### 2. Performance
- Database indexing on `messageId` and `timestamp`
- Connection pooling for MongoDB
- Socket.io Redis adapter for scaling

### 3. Monitoring
- Log all webhook requests
- Monitor processing times
- Alert on processing errors

### 4. Scaling
- Use Redis for Socket.io clustering
- Database sharding for large message volumes
- Load balancing for webhook endpoints

## Environment Variables

```bash
MONGO_URI=mongodb://localhost:27017/whatsapp_clone
JWT_SECRET=your-jwt-secret
PORT=5000
```

## API Endpoints

- `POST /webhook` - WhatsApp webhook endpoint
- `GET /health` - Health check endpoint
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:id` - Get messages by user
- `POST /api/messages` - Send message
