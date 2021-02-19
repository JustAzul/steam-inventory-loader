"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ParseTags(tags) {
    return tags.map(tag => {
        const o = {
            internal_name: tag.internal_name,
            name: tag?.localized_tag_name || tag.name || "",
            category: tag?.category,
            color: tag.color || "",
            category_name: tag?.localized_category_name || tag.category_name
        };
        return o;
    });
}
async function ItemParser(item, description, contextID) {
    const is_currency = !!(item.is_currency || item.currency) || typeof item.currencyid !== 'undefined';
    const id = is_currency ? item.currencyid : item.assetid;
    if (description) {
        const ListingKey = `${item.classid}_${item.instanceid}`;
        if (description.hasOwnProperty(ListingKey))
            description = description[ListingKey];
    }
    let ItemDetails = {
        is_currency,
        id,
        appid: item.appid,
        classid: item.classid,
        assetid: item.assetid,
        instanceid: item.instanceid || "0",
        amount: parseInt(item.amount, 10),
        contextid: item.contextid || contextID,
        tradable: !!description?.tradable,
        marketable: !!description?.marketable,
        commodity: !!description?.commodity,
        owner_descriptions: description?.owner_descriptions || undefined,
        item_expiration: description?.item_expiration || undefined,
        fraudwarnings: description?.fraudwarnings || [],
        descriptions: description?.descriptions || [],
        market_tradable_restriction: description?.market_tradable_restriction ? parseInt(description.market_tradable_restriction.toString(), 10) : 0,
        market_marketable_restriction: description?.market_marketable_restriction ? parseInt(description.market_marketable_restriction.toString(), 10) : 0,
        market_hash_name: description?.market_hash_name,
        actions: description?.actions || [],
        background_color: description.background_color,
        currency: description.currency,
        icon_url: description.icon_url,
        icon_url_large: description.icon_url_large,
        market_name: description.market_name,
        name: description.name,
        type: description.type,
        owner: (description.owner && JSON.stringify(description.owner) == '{}') ? undefined : description.owner
    };
    if (description?.tags)
        ItemDetails.tags = ParseTags(description.tags);
    if (ItemDetails.appid == 753 && ItemDetails.contextid == "6" && ItemDetails.market_hash_name) {
        const _match = ItemDetails.market_hash_name.match(/^(\d+)\-/);
        if (_match)
            ItemDetails.market_fee_app = parseInt(_match[1], 10);
    }
    if (ItemDetails.item_expiration)
        ItemDetails.cache_expiration = ItemDetails.item_expiration;
    else {
        if (ItemDetails.appid == 730 && ItemDetails.contextid == "2" && ItemDetails.owner_descriptions) {
            const Desc = ItemDetails.owner_descriptions.find(d => d.value && d.value.indexOf('Tradable After ') == 0);
            if (Desc) {
                const date = new Date(Desc.value.substring(15).replace(/[,()]/g, ''));
                if (date)
                    ItemDetails.cache_expiration = date.toISOString();
            }
        }
    }
    if (item.currency)
        item.currency = null;
    return ItemDetails;
}
;
exports.default = ItemParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ0Vjb25JdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0NFY29uSXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXFIQSxTQUFTLFNBQVMsQ0FBQyxJQUFjO0lBQ2hDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUVyQixNQUFNLENBQUMsR0FBUTtZQUNkLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYTtZQUNoQyxJQUFJLEVBQUUsR0FBRyxFQUFFLGtCQUFrQixJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUMvQyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVE7WUFDdkIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUN0QixhQUFhLEVBQUUsR0FBRyxFQUFFLHVCQUF1QixJQUFJLEdBQUcsQ0FBQyxhQUFhO1NBQ2hFLENBQUM7UUFFRixPQUFPLENBQUMsQ0FBQztJQUNWLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsSUFBZSxFQUFFLFdBQTRCLEVBQUUsU0FBaUI7SUFFekYsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFdBQVcsQ0FBQztJQUNwRyxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFFeEQsSUFBSSxXQUFXLEVBQUU7UUFFaEIsTUFBTSxVQUFVLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN4RCxJQUFHLFdBQVcsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO1lBQUUsV0FBVyxHQUFHLFdBQVcsQ0FBQyxV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