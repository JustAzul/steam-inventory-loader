export interface ItemAsset {
	amount: string,
	appid: number,
	assetid: string,
	classid: string,
	contextid: string,
	instanceid: string,
	// pos?: number,

	// TODO: ??
	is_currency?: any,
	currency?: any,
	currencyid?: any,
}

export interface Tag {
	internal_name: string,
	name: string,
	category: string,
	color: string,
	category_name: string
}

export interface rawTag {
	category: string,
	internal_name: string,
	localized_category_name?: string,
	localized_tag_name: string,
	category_name: string,
	color?: string,
	name?: string
}

export interface InnerItemDescription {
	value: string
}

export interface ItemActions {
	link: string,
	name: string
}

export interface ItemDescription {
	actions: ItemActions[],
	appid: number,
	background_color: string,
	classid: string,
	commodity: number,
	currency: number,
	descriptions: InnerItemDescription[],
	owner_descriptions?: InnerItemDescription[],
	icon_url: string,
	icon_url_large: string,
	instanceid: string,
	market_fee_app: number,
	market_hash_name: string,
	market_marketable_restriction: number,
	market_name: string,
	market_tradable_restriction: number,
	marketable: number,
	name: string,
	tags: rawTag[],
	tradable: number,
	owner?: any,
	type: string,
	item_expiration?: string,
	[ListingKey: string]: any
}

export interface ItemDetails {
	id: string
	
	is_currency: boolean,
	instanceid: string,
	amount: number,
	contextid: string

	appid: number,
	assetid: string,
	classid: string,
	// pos: number,

	tradable: boolean,
	marketable: boolean,
	commodity: boolean,

	fraudwarnings: [],
	descriptions: InnerItemDescription[],
	owner_descriptions?: InnerItemDescription[],
	
	market_hash_name: string,
	market_tradable_restriction: number,
	market_marketable_restriction: number
	market_fee_app?: number,

	cache_expiration?: string
	item_expiration?: string

	tags?: Tag[],
	actions:ItemActions[],

	owner_actions?: ItemActions[],

	//descs
	
	background_color: string,
	currency: number,
	icon_url: string,
	icon_url_large: string,
	
	market_name: string,
	name: string,
	type: string,
	owner?: any,

}

function ParseTags(tags: rawTag[]): Tag[] {
	return tags.map(tag => {

		const o: Tag = {
			internal_name: tag.internal_name,
			name: tag?.localized_tag_name || tag.name || "",
			category: tag?.category,
			color: tag.color || "",
			category_name: tag?.localized_category_name || tag.category_name
		};

		return o;
	});
}

async function ItemParser(item: ItemAsset, description: ItemDescription, contextID: string, useSqlite: boolean = false) {

	const is_currency = !!(item.is_currency || item.currency) || typeof item.currencyid !== 'undefined';
	const id = is_currency ? item.currencyid : item.assetid;
	
	if (description) {
		// Is this a listing of descriptions?
		const ListingKey = `${item.classid}_${item.instanceid}`;
		if(description.hasOwnProperty(ListingKey)) description = description[ListingKey];		
	}
	
	let ItemDetails: ItemDetails = { 
		is_currency, 
		id,
		appid: item.appid,
		// pos: item.pos,
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

	if(description?.tags) ItemDetails.tags = ParseTags(description.tags);

	// Restore market_fee_app, if applicable
	if(ItemDetails.appid == 753 && ItemDetails.contextid == "6" && ItemDetails.market_hash_name) {
		const _match = ItemDetails.market_hash_name.match(/^(\d+)\-/);
		if(_match) ItemDetails.market_fee_app = parseInt(_match[1], 10);
	}
	
	// If we have item_expiration, also set cache_expiration to the same value
	if (ItemDetails.item_expiration) ItemDetails.cache_expiration = ItemDetails.item_expiration;
	else {
		if(ItemDetails.appid == 730 && ItemDetails.contextid == "2" && ItemDetails.owner_descriptions) {
			const Desc = ItemDetails.owner_descriptions.find(d => d.value && d.value.indexOf('Tradable After ') == 0);
			if(Desc) {
				const date = new Date(Desc.value.substring(15).replace(/[,()]/g, ''));
				if (date) ItemDetails.cache_expiration = date.toISOString();
			}
		}
	}	

	if(item.currency) item.currency = null;

	return ItemDetails;
};

export default ItemParser;