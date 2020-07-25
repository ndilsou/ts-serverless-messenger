import { v4 as uuidv4 } from "uuid";
import * as R from "remeda";

export const generateId = () => uuidv4();

export const compileUpdateExpression = <T extends {[x: string]: any}>(item: T) => {
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
