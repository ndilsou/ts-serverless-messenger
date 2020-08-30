import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { type } from "os";
import { isAppError, isStandardError } from "../common/errors";
import { Service } from "aws-sdk";

export interface ServiceMap {
  [serviceName: string]: any;
}
export type Method = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";
export type Response = APIGatewayProxyResultV2<
  APIGatewayProxyStructuredResultV2
>;
export interface Handler<T extends ServiceMap> {
  (event: APIGatewayProxyEventV2, services: T): Promise<Response>;
}

export class ApiGatewayRouter<T extends ServiceMap> {
  readonly routes: { [routeKey: string]: Handler<T> };
  private services: T;
  constructor(services?: T) {
    this.routes = {};
    this.services = services || ({} as T);
  }

  mount(method: Method, path: string, handler: Handler<T>): this {
    const routeKey = `${method} ${path}`;
    this.routes[routeKey] = handler;
    console.log({ message: `registering route: ${routeKey}` });
    return this;
  }

  async handle(apiGatewayEvent: APIGatewayProxyEventV2): Promise<Response> {
    const handler = this.routes[apiGatewayEvent.routeKey];
    if (typeof handler === "undefined") {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Route not found: ${apiGatewayEvent.routeKey}`,
        }),
      };
    }
    let response: APIGatewayProxyResultV2<APIGatewayProxyStructuredResultV2>;
    try {
      response = await handler(apiGatewayEvent, this.services);
    } catch (error) {
      response = this.handleError(error);
    }
    return response;
  }

  handleError(error: Error): Response {
    let response: Response;
    if (isAppError(error)) {
      if (!error.isOperational) {
        throw error;
      }

      const { httpCode: statusCode, name, message } = error;
      response = {
        statusCode,
        body: JSON.stringify({ error: { name, message } }),
      };
    } else {
      console.error(error);
      const { name, message } = error;
      response = {
        statusCode: 500,
        body: JSON.stringify({ error: { name, message } }),
      };
    }
    return response;
  }
}
