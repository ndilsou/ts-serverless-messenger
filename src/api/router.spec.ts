import { ApiGatewayRouter, Handler } from "./router";

describe("ApiGatewayRouter", () => {
  it("can mount new handlers", () => {
    // GIVEN
    const router = new ApiGatewayRouter();
    const handler1: Handler = async () => ({
      statusCode: 200,
      body: "WOW",
    });
    const handler2: Handler = async () => ({ statusCode: 404, body: "WEE" });

    // WHEN
    router.mount("GET", "/test", handler1).mount("POST", "/live", handler2);

    // THEN
    expect(router.routes["GET /test"]).toBe(handler1);
    expect(router.routes["POST /live"]).toBe(handler2);
  });
});
