import { defineMvuDataStore } from '@util/mvu';
import { Schema } from '../../schema';

export const useDataStore = defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() }, (data) => {
  // 如果 stat_data 不存在，默认值由 Schema 的 prefault 提供
  const raw = getVariables({ type: 'message' });
  if (!raw || !_.has(raw, 'stat_data')) {
    data.value = Schema.parse({});
  }
});