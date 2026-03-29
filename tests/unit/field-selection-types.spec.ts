import { describe, it, expectTypeOf } from 'vitest';
import { Loader } from '../../src/loader/loader.js';
import { Fields } from '../../src/types.js';
import type {
  ItemDetails, LoaderResponse, PartialItem, SelectedItem, InferItem,
} from '../../src/types.js';

describe('Type-safe field selection', () => {
  const loader = new Loader();

  describe('load() return types', () => {
    it('no fields → LoaderResponse<ItemDetails>', () => {
      // Type-only: verify return type without executing
      type Result = Awaited<ReturnType<typeof loader.load>>;
      expectTypeOf<Result>().toEqualTypeOf<LoaderResponse<ItemDetails>>();
    });

    it('specific fields → narrowed to selected fields + assetid', () => {
      const fn = (l: Loader) => l.load('76561198000000123', 730, 2, {
        fields: [Fields.NAME, Fields.TRADABLE] as const,
      });
      type Result = Awaited<ReturnType<typeof fn>>;
      type Expected = LoaderResponse<Pick<ItemDetails, 'assetid' | 'name' | 'tradable'>>;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });

    it('single field → narrowed to that field + assetid', () => {
      const fn = (l: Loader) => l.load('76561198000000123', 730, 2, {
        fields: [Fields.MARKET_HASH_NAME] as const,
      });
      type Result = Awaited<ReturnType<typeof fn>>;
      type Expected = LoaderResponse<Pick<ItemDetails, 'assetid' | 'market_hash_name'>>;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });

    it('wide Fields[] → PartialItem fallback', () => {
      const fn = (l: Loader, f: Fields[]) => l.load('76561198000000123', 730, 2, { fields: f });
      type Result = Awaited<ReturnType<typeof fn>>;
      expectTypeOf<Result>().toEqualTypeOf<LoaderResponse<PartialItem>>();
    });
  });

  describe('loadStream() yield types', () => {
    it('no fields → AsyncGenerator<ItemDetails[]>', () => {
      // Type-only: verify the return type without executing
      type Result = ReturnType<typeof loader.loadStream>;
      expectTypeOf<Result>().toEqualTypeOf<AsyncGenerator<ItemDetails[]>>();
    });

    it('specific fields → AsyncGenerator<narrowed[]>', () => {
      // Type-only: verify narrowing via a typed function reference
      const fn = (l: Loader) => l.loadStream('76561198000000123', 730, 2, {
        fields: [Fields.NAME, Fields.TRADABLE] as const,
      });
      type Result = ReturnType<typeof fn>;
      type Expected = AsyncGenerator<Pick<ItemDetails, 'assetid' | 'name' | 'tradable'>[]>;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });
  });

  describe('static Loader.Loader() return types', () => {
    it('no fields → LoaderResponse<ItemDetails>', () => {
      type Result = Awaited<ReturnType<typeof Loader.Loader>>;
      expectTypeOf<Result>().toEqualTypeOf<LoaderResponse<ItemDetails>>();
    });

    it('specific fields → narrowed', () => {
      const fn = () => Loader.Loader('76561198000000123', 730, 2, {
        fields: [Fields.NAME] as const,
      });
      type Result = Awaited<ReturnType<typeof fn>>;
      type Expected = LoaderResponse<Pick<ItemDetails, 'assetid' | 'name'>>;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });
  });

  describe('utility types', () => {
    it('SelectedItem picks fields + assetid', () => {
      type Result = SelectedItem<[Fields.NAME, Fields.TRADABLE]>;
      expectTypeOf<Result>().toEqualTypeOf<Pick<ItemDetails, 'assetid' | 'name' | 'tradable'>>();
    });

    it('PartialItem is Partial<ItemDetails> & { assetid: string }', () => {
      expectTypeOf<PartialItem>().toMatchTypeOf<{ assetid: string }>();
    });

    it('InferItem<undefined> is ItemDetails', () => {
      expectTypeOf<InferItem<undefined>>().toEqualTypeOf<ItemDetails>();
    });

    it('InferItem<Fields[]> is PartialItem', () => {
      expectTypeOf<InferItem<Fields[]>>().toEqualTypeOf<PartialItem>();
    });

    it('InferItem<[Fields.NAME]> is Pick<ItemDetails, assetid | name>', () => {
      type Result = InferItem<[Fields.NAME]>;
      expectTypeOf<Result>().toEqualTypeOf<Pick<ItemDetails, 'assetid' | 'name'>>();
    });
  });
});
