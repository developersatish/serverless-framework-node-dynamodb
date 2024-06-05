import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { createItem, getItem } from '../handler';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const dynamoDb = new AWS.DynamoDB.DocumentClient({ region: 'localhost', endpoint: 'http://localhost:8000' });

jest.mock('aws-sdk', () => {
    const mDocumentClient = {
        put: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnThis(),
        promise: jest.fn(),
    };
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => mDocumentClient),
        },
    };
});

describe('Handler Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('createItem function creates an item successfully', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            body: JSON.stringify({ id: '1', value: 'Test Value' }),
        };
        const context: Partial<Context> = {};

        const result: any = await createItem(event as APIGatewayProxyEvent, context as Context, () => null);
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body.message).toBe('Item created successfully');
        expect(body.item).toEqual({ id: '1', value: 'Test Value' });

        const putSpy = (dynamoDb.put as jest.Mock).mock.calls[0][0] as DocumentClient.PutItemInput;
        expect(putSpy.TableName).toBe('MyDynamoDbTable');
        expect(putSpy.Item).toEqual({ id: '1', value: 'Test Value' });
    });

    test('getItem function retrieves an item successfully', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
            pathParameters: { id: '2' },
        };
        const context: Partial<Context> = {};

        const mockItem = { id: '2', value: 'Another Test Value' };
        (dynamoDb.get as jest.Mock).mockImplementationOnce(() => ({
            promise: jest.fn().mockResolvedValueOnce({ Item: mockItem }),
        }));

        const result: any = await getItem(event as APIGatewayProxyEvent, context as Context, () => null);
        const body = JSON.parse(result.body);

        expect(result.statusCode).toBe(200);
        expect(body).toEqual(mockItem);

        const getSpy = (dynamoDb.get as jest.Mock).mock.calls[0][0] as DocumentClient.GetItemInput;
        expect(getSpy.TableName).toBe('MyDynamoDbTable');
        expect(getSpy.Key).toEqual({ id: '2' });
    });
});
