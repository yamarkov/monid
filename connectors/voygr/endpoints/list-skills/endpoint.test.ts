import { assertEquals } from "@std/assert";
import { harness } from "../../test-support.ts";

/**
 * `voygr#list-skills`. `happy` is a real answer from api.voygr.tech
 * (2026-10-27): the skill catalogue is public data, recorded without a
 * sub-account.
 */

const h = harness("voygr#list-skills", import.meta.url);

Deno.test("list-skills replays the catalogue for free", async () => {
    const result = await h.run("happy", {});
    assertEquals(result.httpStatus, 200);
    assertEquals(result.isProviderError, false);
    assertEquals(result.usage, { credits: {}, evidence: {} });
    assertEquals(result.output, await h.recorded("happy"));
    const skills = result.output as { skill_id: string }[];
    assertEquals(skills.map((s) => s.skill_id), [
        "cancel-booking",
        "concierge",
        "restaurant-reservation",
    ]);
});

Deno.test("list-skills declares the sub-account binding", () =>
    h.assertBinding());

Deno.test("list-skills fails closed without a sub-account", () =>
    h.assertFailsClosed({}));

Deno.test("list-skills sends a bodyless GET with the workspace's sub-account", () =>
    h.assertOnTheWire({}, {
        method: "GET",
        url: "https://api.voygr.tech/skills",
    }, { body: [] }));
