import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

// 创建一个工具函数来处理带注释的JSON
window.parseJsonWithComments = (jsonString) => {
  // 移除单行注释
  const noComments = jsonString.replace(/\/\/.*$/gm, '');
  try {
    return JSON.parse(noComments);
  } catch (e) {
    console.error('解析JSON失败:', e);
    return null;
  }
};

const app = createApp(App)
app.use(ElementPlus, {
  locale: zhCn
})
app.mount('#app')
