import { z } from "zod";
import { zEnrichBody } from "../../enrich/schema/inputs.ts";

/** One place: the identifying fields of a voygr#enrich body. */
const zPlace = zEnrichBody.pick({
    id: true,
    poi_name: true,
    address: true,
    street: true,
    city: true,
    region: true,
    postcode: true,
    country: true,
    latitude: true,
    longitude: true,
    registered_address: true,
});

/**
 * `POST /v1/jobs/enrich` takes a whole `/v1/enrich` body per row, but the
 * job's status only counts how many rows succeeded, not which. So the
 * places come as a list and the attributes and checks once, for every
 * place: every row then has the same price, and the bill is the rows that
 * succeeded times that price. Left out, as on voygr#enrich: `pois`,
 * `sample`, `estimate_only`, `response_format`, `verify_identity`. Also
 * `max_credits`: the price of the whole job is the estimate, known before
 * it runs.
 */
export const zEnrichBatchBody = zEnrichBody.pick({
    attributes: true,
    include_summary: true,
    validate_existence: true,
    verify_name: true,
    verify_address: true,
    verify_registered_address: true,
}).extend({
    places: z.array(zPlace).min(1).max(10_000).describe(
        "The places to enrich, 1 to 10,000. The attributes and checks " +
            "below apply to every place.",
    ),
});
