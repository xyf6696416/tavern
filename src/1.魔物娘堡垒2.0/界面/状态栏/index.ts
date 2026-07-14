import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

$(async () => {
  await waitGlobalInitialized('Mvu');
  // 兼容0层无数据的情况
  try {
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'), { timeout: 5000 });
  } catch {
    // 超时也没关系，Vue内部会处理标题界面
  }
  createApp(App).use(createPinia()).mount('#app');
});