import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Poker Planning API',
      version: '1.0.0',
      description: 'API documentation for Poker Planning application - a collaborative estimation tool using XS, S, M, L voting cards',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /session endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier (ULID)',
              example: '01HXYZ123ABC456DEF789GHI',
            },
            name: {
              type: 'string',
              description: 'User display name',
              example: 'John Doe',
            },
          },
        },
        Participant: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
              example: '01HXYZ123ABC456DEF789GHI',
            },
            name: {
              type: 'string',
              description: 'User name',
              example: 'John Doe',
            },
          },
        },
        SessionResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              description: 'JWT authentication token (valid for 24 hours)',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        RoomResponse: {
          type: 'object',
          properties: {
            room_id: {
              type: 'string',
              description: 'Unique room identifier (ULID)',
              example: '01HXYZ987ZYX654WVU321TSR',
            },
            name: {
              type: 'string',
              description: 'Room name (optional)',
              example: 'Sprint Planning Room',
            },
            created_by: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '01HXYZ123ABC456DEF789GHI',
                },
                name: {
                  type: 'string',
                  example: 'John Doe',
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Room creation timestamp',
              example: '2026-02-11T12:00:00.000Z',
            },
            participants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Participant',
              },
              description: 'List of users who have joined the room',
            },
            votes: {
              type: 'object',
              additionalProperties: {
                type: 'string',
                enum: ['XS', 'S', 'M', 'L'],
              },
              description: 'Map of user IDs to their votes',
              example: {
                '01HXYZ123ABC456DEF789GHI': 'M',
                '01HXYZ456DEF789GHI123ABC': 'L',
              },
            },
            votingStatus: {
              type: 'string',
              enum: ['idle', 'active', 'closed'],
              description: 'Current voting session status',
              example: 'active',
            },
            votingStartedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when voting was started (only present when voting is active or closed)',
              example: '2026-02-11T12:05:00.000Z',
            },
            votingClosedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when voting was closed (only present when voting is closed)',
              example: '2026-02-11T12:10:00.000Z',
            },
            votingDuration: {
              type: 'string',
              description: 'Duration of voting session in mm:ss format (calculated, only in response)',
              example: '05:30',
            },
            revealed: {
              type: 'boolean',
              description: 'Whether votes are revealed to all participants',
              example: false,
            },
            agreedValue: {
              type: 'string',
              enum: ['XS', 'S', 'M', 'L'],
              description: 'The consensus estimate agreed upon by the team (only present after agreement)',
              example: 'M',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Name is required',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User session management',
      },
      {
        name: 'Rooms',
        description: 'Poker planning room operations',
      },
      {
        name: 'Voting',
        description: 'Voting session management',
      },
    ],
  },
  apis: ['./src/openapi/**/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);
