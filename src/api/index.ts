import { APIGatewayEvent, APIGatewayProxyResultV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda"

export const handler = async (
  event: APIGatewayEvent,
): Promise<APIGatewayProxyResultV2<APIGatewayProxyStructuredResultV2>> => {
    console.log(event)
    return {statusCode: 200, body: "WOW!"}
}

export const dispatch = async (event: APIGatewayEvent) => {
  

}