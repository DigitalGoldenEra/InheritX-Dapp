/**
 * Swagger/OpenAPI Configuration
 * API documentation setup for InheritX backend
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InheritX API',
      version: '1.0.0',
      description: '',

    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}/api`,
        description: 'Development server',
      },
      {
        url: 'https://api.inheritx.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            walletAddress: { type: 'string' },
            email: { type: 'string', nullable: true },
            name: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
            kycStatus: { type: 'string' },
            planCount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        KYC: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            fullName: { type: 'string' },
            email: { type: 'string' },
            idType: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            reviewedAt: { type: 'string', format: 'date-time', nullable: true },
            rejectionReason: { type: 'string', nullable: true },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            globalPlanId: { type: 'number', nullable: true },
            userPlanId: { type: 'number', nullable: true },
            planName: { type: 'string' },
            planDescription: { type: 'string' },
            assetType: { type: 'string' },
            assetAmount: { type: 'string' },
            distributionMethod: { type: 'string' },
            transferDate: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            beneficiaries: {
              type: 'array',
              items: { $ref: '#/components/schemas/Beneficiary' },
            },
          },
        },
        Beneficiary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string' },
            relationship: { type: 'string' },
            allocatedPercentage: { type: 'number' },
            allocatedAmount: { type: 'string' },
            hasClaimed: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'KYC',
        description: 'Know Your Customer verification',
      },
      {
        name: 'Plans',
        description: 'Inheritance plan management',
      },
      {
        name: 'Claims',
        description: 'Beneficiary claim processing',
      },
      {
        name: 'Admin',
        description: 'Administrative operations (requires ADMIN role)',
      },
      {
        name: 'Webhooks',
        description: 'Blockchain event webhooks',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

