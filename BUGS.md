# 代码审查 — Bug 清单

> 审查时间：2026-06-07

---

## 🔴 Critical — 必须修复

### 1. 数据库静默回退到本地路径
**文件：** `src/lib/prisma.ts` — 第 8 行
**问题：** `DATABASE_URL` 为空时自动用 `file:./prisma/dev.db`。生产环境如果环境变量配错，会静默连到空库，造成"数据丢失"假象。
```ts
// 当前
url: process.env.DATABASE_URL || "file:./prisma/dev.db",
// 建议：生产环境下应直接报错，不使用 fallback
```

### 2. AI 智能标签接口可越权操作其他用户的条目
**文件：** `src/app/api/ai/route.ts` — 第 174 行
**问题：** `action === "smart-tags"` 时用 `entryId` 查条目没有 `userId` 过滤。攻击者可给其他用户创建标签，并枚举他人标签名。
```ts
// 当前
const entry = await prisma.entry.findUnique({ where: { id: entryId } });
// 建议：加上 userId 过滤
```

### 3. AI 润色接口可越权读取其他用户的规则
**文件：** `src/app/api/ai/route.ts` — 第 119-124 行
**问题：** `action === "polish"` 时用 `projectId` 查规则没有所有权验证，可间接泄露他人规则内容。

### 4. 规则更新接口无所有权过滤
**文件：** `src/app/api/rules/route.ts` — 第 60 行
**问题：** PUT 更新规则时 `where: { id }` 没加 `userId`，任意用户可修改任意规则。
```ts
// 当前
const rule = await prisma.rule.update({ where: { id }, data: { ... } });
// 建议：改用 updateMany 并加上 userId 过滤
```

### 5. 编辑历史与文章更新不在事务中
**文件：** `src/app/api/projects/[id]/entries/[entryId]/route.ts` — 第 46-63 行
**问题：**
- `editHistory.create` 和 `entry.updateMany` 未用 `$transaction` 包裹，中途失败会产生孤立历史记录
- 历史记录只保存天气/农历，不保存 title/content，无法还原正文修改

---

## 🟠 High — 应该修复

### 6. 注册接口安全缺陷
**文件：** `src/app/api/auth/register/route.ts`
- 无密码强度要求，"1" 这种密码也能通过
- 邮箱未标准化（大小写），`User@Example.com` 和 `user@example.com` 视为不同用户
- catch 块吞掉错误无日志：`catch { return NextResponse.json({ error: "注册失败" }) }`

### 7. 天气接口无认证 + URL 参数未编码
**文件：** `src/app/api/weather/route.ts`
- `lat`/`lon` 未做 `encodeURIComponent`，可直接拼入 URL，存在参数注入风险
- 接口无需登录即可调用

### 8. 列表接口无分页
**文件：** `src/app/api/entries/route.ts`、`src/app/api/projects/[id]/route.ts`
**问题：** `findMany` 无 `take`/`skip`，条目数量大时可能 OOM。

### 9. 前端 XSS 风险
- **`src/app/projects/[id]/[entryId]/page.tsx:68`** — `dangerouslySetInnerHTML` 直接渲染用户输入的 HTML
- **`src/app/projects/[id]/[entryId]/edit/page.tsx:95`** — AI 返回内容用字符串拼接插入 HTML，未转义
  ```ts
  const formatted = `<p>${aiContent.split("\n").join("</p><p>")}</p>`;
  ```

### 10. useSearchParams 缺少 Suspense 包裹
**文件：** `src/components/SearchInput.tsx`、`EntryFilters.tsx`、`EntriesFilter.tsx`
**问题：** Next.js 15 要求所有使用 `useSearchParams()` 的组件必须包裹在 `<Suspense>` 中，否则会触发构建警告或降级为动态渲染。

### 11. 数据库缺少外键索引
**文件：** `prisma/schema.prisma`
**问题：** 以下外键列无索引，数据量大时全表扫描：
- `Project.userId`
- `Entry.projectId`
- `Tag.userId`
- `Rule.userId`、`Rule.projectId`
- `EditHistory.entryId`

---

## 🟡 Medium — 建议修复

### 12. 所有 API 路由缺少错误日志
**影响文件（13 个）：** `batch/route.ts`、`entries/route.ts`、`tags/route.ts`、`export/route.ts`、`lunar/route.ts`、`projects/route.ts`、`projects/[id]/route.ts`、`projects/[id]/entries/route.ts`、`projects/[id]/entries/[entryId]/route.ts`、`rules/route.ts`、`tags/cleanup/route.ts`、`auth/signout/route.ts`、`entries/[entryId]/tags/route.ts`
**问题：** 全部没有 try/catch，异常直接抛给 Next.js 默认处理，无服务端日志。

### 13. 批量操作存在标签删除竞态条件
**文件：** `src/app/api/batch/route.ts` — 第 48-53 行
**问题：** `deleteMany` 和 `cleanupEmptyTags` 之间，其他请求读到的条目会显示无标签。

### 14. 中间件仅检查 cookie 存在性而非 JWT 有效性
**文件：** `src/proxy.ts` — 第 5-6 行
**问题：** 仅检查 `authjs.session-token` cookie 是否存在，不做 JWT 签名验证。攻击者可伪造任意 cookie 绕过中间件。

### 15. AI 请求重试无退避
**文件：** `src/app/api/ai/route.ts` — 第 101-108 行
**问题：** 失败后立即重试，遇到限流（429）会连续两次失败。

### 16. AI 路由将用户内容写入生产日志
**文件：** `src/app/api/ai/route.ts` — 第 15、39 行
**问题：** `console.log` 输出用户日记内容前 100 字符和 AI 响应前 500 字符，泄露隐私。

### 17. 编辑页农历日期竞态条件
**文件：** `src/app/projects/[id]/[entryId]/edit/page.tsx` — 第 52-73 行
**问题：** 两个 `useEffect` 分别设置农历日期，可能互相覆盖。

### 18. 保存失败静默跳转
**文件：** `src/app/projects/[id]/new/page.tsx`、`edit/page.tsx`
**问题：** 保存 API 调用无 `.catch()`，失败后仍执行 `router.push`，用户看不到错误提示。

### 19. TagManager 数据一致性问题
**文件：** `src/components/TagManager.tsx` — 第 16-46 行
**问题：** 先创建标签更新本地状态，再关联到条目。若关联失败，本地状态已更新但服务端未生效。

### 20. 多个文件中标签删除逻辑重复
**影响文件：** `entries/[entryId]/tags/route.ts`、`projects/[id]/entries/[entryId]/route.ts`、`batch/route.ts`、`tags/route.ts`、`tags/cleanup/route.ts`
**问题：** 相同的空标签清理逻辑在 5 个文件中各自实现，维护成本高。

---

## 🟢 Low — 可选修复

21. `projects/[id]/route.ts:39` — PUT 返回 `{ count }` 而非更新后的项目对象
22. `LiveClock.tsx:51` — 组件卸载后 fetch 完成时可能 setState（内存泄漏）
23. `register/page.tsx` / `login/page.tsx` — 成功路径未调用 `setLoading(false)`
24. `EntriesListClient.tsx:146` — 标签列表使用数组 index 作为 React key
25. `AIPolishModal.tsx`、`BatchActions.tsx` — 模态框缺少 `role="dialog"` 等 ARIA 属性
26. `ProjectActions.tsx:12` — 使用 `window.location.href` 而非 `router.push`
27. `next.config.ts` — 未配置 CSP（Content Security Policy）安全头
28. `auth.ts:7` — `trustHost: true` 无条件开启，生产环境建议限制具体域名
29. 所有接口无限流保护，AI 接口可被刷量消耗费用

---

## 修复优先级建议

| 优先级 | 编号 | 影响 |
|--------|------|------|
| P0 | 1-5 | 数据安全 + 越权漏洞 |
| P1 | 6-11 | 安全加固 + 性能 |
| P2 | 12-20 | 稳定性 + 可维护性 |
| P3 | 21-29 | 体验优化 |
