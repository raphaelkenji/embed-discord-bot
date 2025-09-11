# Discord Embed Bot

This is my attempt at making my own discord bot to fix url embeds from messages. 

## Commands

### `/track`
Toggle embed tracking for your messages.
- `activated`: Enable or disable URL replacement for your messages

### `/url` (Admin only)
Manage URL replacement configurations.
- `list`: View all configured URL replacements
- `add`: Add a new URL replacement rule
- `remove`: Remove a URL replacement rule
- `update`: Update an existing URL replacement rule

## Project Structure

```
src/
├── commands/          # Discord slash commands
├── config/           # Configuration files
├── events/           # Discord event handlers
│   ├── client/       # Client events (ready, error)
│   ├── guild/        # Guild events (interactions)
│   └── message/      # Message events (create, update, delete)
├── models/           # Database models
├── services/         # Business logic
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and constants
└── index.ts          # Application entry point
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    activated BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### URLs Table
```sql
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    original_url VARCHAR NOT NULL,
    regex VARCHAR NOT NULL,
    replacement_url VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```