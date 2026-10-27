import { assertEquals, assertRejects } from "@std/assert";
import { type Json, type RunInput } from "@shared/core";
import {
    assertInputAccepted,
    runEndpoint,
    testSealedUnit,
} from "@shared/testing";
import { harness, OWNED } from "../../test-support.ts";

/**
 * `voygr#cancel-call`. SYNTHETIC, shaped from the public OpenAPI: the answer
 * is `{cancelled: bool}`. A call that is unknown, not this sub-account's or
 * already finished answers `cancelled: false` and never 404, so a retry is
 * safe. Ids are made up.
 */

const ID = "voygr#cancel-call";
const h = harness(ID, import.meta.url);
const INPUT = { pathParams: { call_id: "c_synthetic02" } };

Deno.test("cancel-call cancelled true settles zero", async () => {
    const result = await h.run("synthetic-cancelled", INPUT);
    assertEquals(result.httpStatus, 200);
    assertEquals(result.isProviderError, false);
    assertEquals(result.usage, { credits: {}, evidence: {} });
    assertEquals(result.output, { cancelled: true });
});

Deno.test("cancel-call cancelled false is an answer, not an error", async () => {
    const result = await h.run("synthetic-not-cancelled", {
        pathParams: { call_id: "c_synthetic99" },
    });
    assertEquals(result.httpStatus, 200);
    assertEquals(result.isProviderError, false);
    assertEquals(result.usage, { credits: {}, evidence: {} });
    assertEquals(result.output, { cancelled: false });
});

Deno.test("cancel-call schema: call_id is required and non-empty", async () => {
    const unit = await testSealedUnit(ID);
    const rejected: [string, RunInput][] = [
        ["no path params", {}],
        ["no call_id", { pathParams: {} }],
        ["empty call_id", { pathParams: { call_id: "" } }],
        ["a typo'd key", { pathParams: { callid: "c_1" } }],
    ];
    for (const [shape, input] of rejected) {
        await assertRejects(
            () =>
                runEndpoint({
                    unit,
                    input,
                    mode: "replay",
                    resources: [OWNED],
                }),
            Error,
            "INVALID_INPUT",
            shape,
        );
    }
    await assertInputAccepted({
        unit,
        input: INPUT,
        mode: "replay",
        fixture: await h.fixture("synthetic-cancelled"),
        resources: [OWNED],
    });
});

Deno.test("cancel-call declares the sub-account binding", () =>
    h.assertBinding());

Deno.test("cancel-call fails closed without a sub-account", () =>
    h.assertFailsClosed(INPUT));

Deno.test("cancel-call sends a POST with no body and the workspace's sub-account", () =>
    h.assertOnTheWire(INPUT, {
        method: "POST",
        url: "https://api.voygr.tech/calls/c_synthetic02/cancel",
    }, { body: { cancelled: true } }));
