"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ParseTags(tags) {
    return tags.map((tag) => {
        const o = {
            internal_name: tag.internal_name,
            name: tag?.localized_tag_name || tag.name || '',
            category: tag?.category,
            color: tag.color || '',
            category_name: tag?.localized_category_name || tag.category_name,
        };
        return o;
    });
}
function ItemParser(item, description, contextID) {
    const is_currency = !!(item.is_currency || item.currency) || typeof item.currencyid !== 'undefined';
    const id = is_currency ? item.currencyid : item.assetid;
    if (description) {
        const ListingKey = `${item.classid}_${item.instanceid}`;
        if (Object.prototype.hasOwnProperty.call(description, ListingKey))
            description = description[ListingKey];
    }
    const Details = {
        is_currency,
        id,
        appid: item.appid,
        classid: item.classid,
        assetid: item.assetid,
        instanceid: item.instanceid || '0',
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
        owner: (description.owner && JSON.stringify(description.owner) == '{}') ? undefined : description.owner,
    };
    if (description?.tags)
        Details.tags = ParseTags(description.tags);
    if (Details.appid == 753 && Details.contextid == '6' && Details.market_hash_name) {
        const _match = Details.market_hash_name.match(/^(\d+)-/);
        if (_match)
            Details.market_fee_app = parseInt(_match[1], 10);
    }
    if (Details.item_expiration)
        Details.cache_expiration = Details.item_expiration;
    else if (Details.appid == 730 && Details.contextid == '2' && Details.owner_descriptions) {
        const Desc = Details.owner_descriptions.find((d) => d.value && d.value.indexOf('Tradable After ') === 0);
        if (Desc) {
            const date = new Date(Desc.value.substring(15).replace(/[,()]/g, ''));
            if (date)
                Details.cache_expiration = date.toISOString();
        }
    }
    if (item.currency)
        item.currency = null;
    return Details;
}
exports.default = ItemParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ0Vjb25JdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0NFY29uSXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQW9KQSxTQUFTLFNBQVMsQ0FBQyxJQUFjO0lBQy9CLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ3RCLE1BQU0sQ0FBQyxHQUFRO1lBQ2IsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhO1lBQ2hDLElBQUksRUFBRSxHQUFHLEVBQUUsa0JBQWtCLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFO1lBQy9DLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUTtZQUN2QixLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ3RCLGFBQWEsRUFBRSxHQUFHLEVBQUUsdUJBQXVCLElBQUksR0FBRyxDQUFDLGFBQWE7U0FDakUsQ0FBQztRQUVGLE9BQU8sQ0FBQyxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxVQUFVLENBQUMsSUFBZSxFQUFFLFdBQTRCLEVBQUUsU0FBaUI7SUFFbEYsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFdBQVcsQ0FBQztJQUVwRyxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFFeEQsSUFBSSxXQUFXLEVBQUU7UUFFZixNQUFNLFVBQVUsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRXhELElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENB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