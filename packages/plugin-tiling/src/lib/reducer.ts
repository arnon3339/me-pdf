import { CoreState, Reducer } from '@embedpdf/core';
import { Tile, TilingPluginConfig, TilingState } from './types';
import {
  UPDATE_VISIBLE_TILES,
  MARK_TILE_STATUS,
  TilingAction
} from './actions';

export const initialState = (_coreState: CoreState, _config: TilingPluginConfig): TilingState => ({
  visibleTiles : {}
});

export const tilingReducer: Reducer<TilingState, TilingAction> = (state, action) => {
  switch (action.type) {
    case UPDATE_VISIBLE_TILES:
      return { ...state, visibleTiles: action.payload };

    case MARK_TILE_STATUS: {
      const { pageIndex, tileId, status } = action.payload;
      const tiles = state.visibleTiles[pageIndex]?.map(t =>
        t.id === tileId ? { ...t, status } as Tile : t
      ) ?? [];

      const newTiles = tiles.filter(t => !t.isFallback);
      const allReady = newTiles.every(t => t.status === 'ready');
      const finalTiles = allReady ? newTiles : tiles;

      return {
        ...state,
        visibleTiles: { ...state.visibleTiles, [pageIndex]: finalTiles }
      };
    }

    default:
      return state;
  }
};