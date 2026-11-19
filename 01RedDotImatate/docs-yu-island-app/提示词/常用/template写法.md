## 不要将大量纯文字部分放在 vue 文件中
- 规范示例参考
```ts
const pageText = {
  expandContent: '展开全文',
  collapseContent: '收起全文',
  missingNoteId: '缺少笔记标识',
  loadFailed: '笔记加载失败',
  visibility: {
    title: '谁可以看',
    hint: '修改后立即生效，已发出的分享链接不受影响',
    cancel: '取消',
    options: [
      { value: 'public', title: '公开', text: '所有人可见，可出现在发现流、搜索与他人主页', icon: 'browse' },
      { value: 'private', title: '仅自己可看', text: '只有自己能看到，他人打开链接显示内容不存在', icon: 'lock-on' },
      { value: 'mutual', title: '互关可见', text: '仅互相关注的好友可见，不进入发现流与搜索', icon: 'usergroup' }
    ]
  }
} as const
```