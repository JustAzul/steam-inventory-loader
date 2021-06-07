"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function ParseTags(tags) {
    const ParsedTags = [];
    {
        const Iterate = () => new Promise((resolve) => {
            const Execute = (i = 0) => {
                if (i === tags.length) {
                    resolve();
                    return;
                }
                const tag = tags[i];
                const o = {
                    internal_name: tag.internal_name,
                    name: tag?.localized_tag_name || tag.name || '',
                    category: tag?.category,
                    color: tag.color || '',
                    category_name: tag?.localized_category_name || tag.category_name,
                };
                ParsedTags.push(o);
                setImmediate(Execute.bind(null, i + 1));
            };
            Execute();
        });
        await Iterate();
    }
    return ParsedTags;
}
async function ItemParser(item, description, contextID) {
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
        Details.tags = await ParseTags(description.tags);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ0Vjb25JdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0NFY29uSXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQW9KQSxLQUFLLFVBQVUsU0FBUyxDQUFDLElBQWM7SUFDckMsTUFBTSxVQUFVLEdBQVMsRUFBRSxDQUFDO0lBRTVCO1FBQ0UsTUFBTSxPQUFPLEdBQUcsR0FBaUIsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDMUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQUU7b0JBQ3JCLE9BQU8sRUFBRSxDQUFDO29CQUNWLE9BQU87aUJBQ1I7Z0JBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVwQixNQUFNLENBQUMsR0FBUTtvQkFDYixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWE7b0JBQ2hDLElBQUksRUFBRSxHQUFHLEVBQUUsa0JBQWtCLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxFQUFFO29CQUMvQyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVE7b0JBQ3ZCLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBQ3RCLGFBQWEsRUFBRSxHQUFHLEVBQUUsdUJBQXVCLElBQUksR0FBRyxDQUFDLGFBQWE7aUJBQ2pFLENBQUM7Z0JBRUYsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQztZQUVGLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLE9BQU8sRUFBRSxDQUFDO0tBQ2pCO0lBRUQsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVELEtBQUssVUFBVSxVQUFVLENBQUMsSUFBZSxFQUFFLFdBQTRCLEVBQUUsU0FBaUI7SUFFeEYsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFdBQVcsQ0FBQztJQUVwRyxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7SUFFeEQsSUFBSSxXQUFXLEVBQUU7UUFFZixNQUFNLFVBQVUsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRXhELElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUM7WUFBRSxXQUFXLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzFHO0lBRUQsTUFBTSxPQUFPLEdBQWdCO1FBQzNCLFdBQVc7UUFDWCxFQUFFO1FBQ0YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1FBRWpCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87UUFDckIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksR0FBRztRQUNsQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1FBQ2pDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVM7UUFFdEMsUUFBUSxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsUUFBUTtRQUNqQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxVQUFVO1FBQ3JDLFNBQVMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLFNBQVM7UUFFbkMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixJQUFJLFNBQVM7UUFDaEUsZUFBZSxFQUFFLFdBQVcsRUFBRSxlQUFlLElBQUksU0FBUztRQUUxRCxhQUFhLEVBQUUsV0FBVyxFQUFFLGFBQWEsSUFBSSxFQUFFO1FBQy9DLFlBQVksRUFBRSxXQUFXLEVBQUUsWUFBWSxJQUFJLEVBQUU7UUFFN0MsMkJBQTJCLEVBQUUsV0FBVyxFQUFFLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLDJCQUEyQixDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVJLDZCQUE2QixFQUFFLFdBQVcsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyw2QkFBNkIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsSixnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsZ0JBQWdCO1FBRS9DLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxJQUFJLEVBQUU7UUFDbkMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLGdCQUFnQjtRQUM5QyxRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVE7UUFDOUIsUUFBUSxFQUFFLFdBQVcsQ0FBQyxRQUFRO1FBQzlCLGNBQWMsRUFBRSxXQUFXLENBQUMsY0FBYztRQUMxQyxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7UUFDcEMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxJQUFJO1FBQ3RCLElBQUksRUFBRSxXQUFXLENBQUMsSUFBSTtRQUd0QixLQUFLLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLO0tBRXhHLENBQUM7SUFFRixJQUFJLFdBQVcsRUFBRSxJQUFJO1FBQUUsT0FBTyxDQUFDLElBQUksR0FBRyxNQUFNLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFJeEUsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLEdBQUcsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEVBQUU7UUFFaEYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6RCxJQUFJLE1BQU07WUFBRSxPQUFPLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDOUQ7SUFHRCxJQUFJLE9BQU8sQ0FBQyxlQUFlO1FBQUUsT0FBTyxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUM7U0FFM0UsSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLEdBQUcsSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUU7UUFDdkYsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3pHLElBQUksSUFBSSxFQUFFO1lBQ1IsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksSUFBSTtnQkFBRSxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ3pEO0tBQ0Y7SUFHRCxJQUFJLElBQUksQ0FBQyxRQUFRO1FBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFFeEMsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVELGtCQUFlLFVBQVUsQ0FBQyJ9