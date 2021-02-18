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
async function ItemParser(item, description, contextID, useSqlite = false) {
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
        type: description.type
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ0Vjb25JdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0NFY29uSXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQW9IQSxTQUFTLFNBQVMsQ0FBQyxJQUFjO0lBQ2hDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUVyQixNQUFNLENBQUMsR0FBUTtZQUNkLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYTtZQUNoQyxJQUFJLEVBQUUsR0FBRyxFQUFFLGtCQUFrQixJQUFJLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUMvQyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVE7WUFDdkIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUN0QixhQUFhLEVBQUUsR0FBRyxFQUFFLHVCQUF1QixJQUFJLEdBQUcsQ0FBQyxhQUFhO1NBQ2hFLENBQUM7UUFFRixPQUFPLENBQUMsQ0FBQztJQUNWLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsSUFBZSxFQUFFLFdBQTRCLEVBQUUsU0FBaUIsRUFBRSxZQUFxQixLQUFLO0lBRXJILE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLFVBQVUsS0FBSyxXQUFXLENBQUM7SUFDcEcsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBRXhELElBQUksV0FBVyxFQUFFO1FBRWhCLE1BQU0sVUFBVSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDeEQsSUFBRyxXQUFXLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztZQUFFLFdBQVcs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