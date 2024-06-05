'use strict';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as Joi from 'joi';

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'localhost', endpoint: 'http://localhost:8000' });

const schema = Joi.object({
  id: Joi.string().required(),
  value: Joi.string().required(),
});

export const createItem: APIGatewayProxyHandler = async (event) => {
  const data = JSON.parse(event.body || '{}');
  const { error } = schema.validate(data);
  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid input', error: error.details }),
    };
  }

  const params = {
    TableName: 'MyDynamoDbTable',
    Item: {
      id: data.id,
      value: data.value,
    },
  };

  try {
    await dynamoDb.put(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Item created successfully', item: params.Item }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating item', error: error.message }),
    };
  }
};

export const getItem: APIGatewayProxyHandler = async (event) => {
  const params = {
    TableName: 'MyDynamoDbTable',
    Key: {
      id: event.pathParameters?.id || '',
    },
  };

  try {
    const result = await dynamoDb.get(params).promise();
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Item not found' }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error retrieving item', error: error.message }),
    };
  }
};
