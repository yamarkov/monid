import { z } from "zod";

/**
 * One research field. The name picks the field; the rest tell VOYGR what you
 * mean by it. `include` is for `owners` and `key_people` only.
 */
const zFieldSpec = z.strictObject({
    name: z.string().min(1).max(100).describe(
        "The field's name, for example `wheelchair_accessible`. `owners` " +
            "returns the individual owners or franchisees (name and role); " +
            "`owner_org` returns the operating company when there is no " +
            "individual owner, and a place never gets both. " +
            "`key_people` returns leadership beyond the owner (name and title).",
    ),
    description: z.string().max(500).optional().describe(
        "What you mean by the field, in plain words. VOYGR reads it as " +
            "data and does not follow instructions in it.",
    ),
    value_type: z.string().optional().describe(
        "A hint for the answer's type: bool, enum, string or number.",
    ),
    allowed_values: z.array(z.string()).optional().describe(
        "For an enum field, the values it may take.",
    ),
    include: z.array(z.enum(["phone", "email", "linkedin"])).max(3).optional()
        .describe(
            "`owners` and `key_people` only: look up each person's phone, " +
                "email or LinkedIn. Each costs 1 more credit.",
        ),
});

/**
 * `POST /v1/enrich` for ONE place (VOYGR's flat shape). Left out on purpose:
 *   - `pois` and `sample`: the list shape returns a different, matrix-shaped
 *     answer and bills per row
 *   - `estimate_only`: a dry run answers 200 and bills nothing, but this
 *     endpoint settles on the request, so a dry run would be charged
 *   - `response_format`: `cell` changes the answer's shape
 *   - `verify_identity`: deprecated for `verify_name` plus `verify_address`
 * The object is strict, so a field VOYGR adds later is refused here rather
 * than sent without a rule for what it costs.
 */
export const zEnrichBody = z.strictObject({
    id: z.string().max(100).optional().describe(
        "Your own identifier for the place, echoed back in the answer.",
    ),
    poi_name: z.string().min(1).max(200).describe("The place's name."),
    address: z.string().max(500).optional().describe(
        "The address as one string. Send this or the parts below.",
    ),
    street: z.string().optional().describe("Street address."),
    city: z.string().optional().describe("City."),
    region: z.string().optional().describe("State or province."),
    postcode: z.string().optional().describe("Postal or ZIP code."),
    country: z.string().optional().describe(
        "2-letter ISO country code, for example US.",
    ),
    latitude: z.number().min(-90).max(90).optional().describe(
        "Latitude in decimal degrees (WGS84).",
    ),
    longitude: z.number().min(-180).max(180).optional().describe(
        "Longitude in decimal degrees (WGS84).",
    ),
    registered_address: z.string().max(500).optional().describe(
        "The place's registered (legal) address, if you have one. " +
            "`address` stays the trading address.",
    ),
    attributes: z.array(z.union([z.string(), zFieldSpec])).min(1).max(20)
        .optional().describe(
            "What to return, 1 to 20 items. Standard attributes " +
                "(opening_hours, phone, website, facebook, instagram, tiktok, " +
                "x, email, existence, open_closed) cost 1 credit per place " +
                "however many you ask for. Any other name is a research " +
                "field, answered by a bounded research loop and billed at 1 " +
                "credit per field. A request may mix both and pays for each. " +
                "`owners` and `key_people` cost 2, plus 1 for each contact " +
                "in `include`. Leave it out for the standard set.",
        ),
    include_summary: z.boolean().optional().describe(
        "Also return a short factual `place_summary`. It costs nothing " +
            "extra.",
    ),
    validate_existence: z.boolean().optional().describe(
        "Also check that the place exists, returned as an `existence` " +
            "attribute.",
    ),
    verify_name: z.boolean().optional().describe(
        "Confirm the business's name first, and research every " +
            "attribute against it. 1 credit per place, shared with " +
            "`verify_address`: both together still cost 1.",
    ),
    verify_address: z.boolean().optional().describe(
        "Check the trading address you sent; it is never replaced. 1 credit " +
            "per place, shared with `verify_name`.",
    ),
    verify_registered_address: z.boolean().optional().describe(
        "Check the registered address you sent. 1 credit per place, " +
            "separate from the other checks.",
    ),
    max_credits: z.number().int().min(0).optional().describe(
        "A ceiling for this request. If VOYGR's estimate is higher it " +
            "refuses with 402 before running anything.",
    ),
});
