import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import createError from 'http-errors';
import { getConfig } from '@/utils/env';
import logger from '@/services/logger';
import { User } from '@/types/user';
import { Config } from '@/constants';

const client: DynamoDBClient = new DynamoDBClient({
  region: getConfig('AWS_REGION'),
});

export const createUser = async (user: User): Promise<void> => {
  const command = new PutItemCommand({
    TableName: getConfig(Config.USERS_TABLE_NAME),
    Item: marshall(user),
    ConditionExpression: 'attribute_not_exists(id)',
  });

  try {
    await client.send(command);
  } catch (error) {
    const { name, message } = <Error>error;

    if (name === 'ConditionalCheckFailedException') {
      throw createError(400, `User id ${user.id} already exists`);
    }
    logger.error(`createUser ${name}: ${message}`);
    throw createError(500, 'User registration error');
  }
};
