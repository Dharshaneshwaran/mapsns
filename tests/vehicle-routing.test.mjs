import { test } from "node:test";
import assert from "node:assert/strict";
import { requestRoute } from "../lib/requestRoute.ts";

test("vehicle requests skip alternatives and preserve cancellation", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  try {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /routed-car/);
      assert.equal(new URL(url).searchParams.get("alternatives"), "false");
      assert.equal(new URL(url).searchParams.get("bearings"), "90,90;");
      controller.abort();
      assert.equal(options.signal.aborted, true);
      options.signal.throwIfAborted();
    };
    await assert.rejects(requestRoute({ lat: 11, lng: 77 }, { lat: 11.001, lng: 77.001 }, "vehicle", controller.signal, 90), { name: "AbortError" });
  } finally { globalThis.fetch = original; }
});
