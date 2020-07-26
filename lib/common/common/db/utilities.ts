import { v4 as uuidv4 } from "uuid";
import * as R from "remeda";

export const generateId = () => uuidv4();

export const compileUpdateExpression = <T extends { [x: string]: any }>(
  item: T
) => {
  let updateExpression = Object.keys(item)
    .map((k, i) => `${k} = :${k}`)
    .join(", ");
  updateExpression = `SET ${updateExpression}`;
  const expressionAttributeValues = R.mapKeys(item, (k, v) => `:${k}`);
  return {
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
};

export type PrimaryKeyAttrs = { HK: string; SK: string };
export type DynamoItem = PrimaryKeyAttrs & {
  createdDate: string;
  updatedDate: string;
};
export type Attrs = { createdDate: Date; updatedDate: Date };
export const parseAttributes = <T extends Attrs>(item: DynamoItem): [PrimaryKeyAttrs, T] => {
  const { HK, SK, createdDate, updatedDate, ...attrs } = item;

  const primaryKey = { HK, SK };
  const parsedAttrs = {
    ...attrs,
    createdDate: new Date(createdDate),
    updatedDate: new Date(updatedDate),
  } as T;

  return [primaryKey, parsedAttrs];
};
