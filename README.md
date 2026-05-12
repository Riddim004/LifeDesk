# LifeDesk | 人生事务台

LifeDesk 是一个可以在个人电脑上独立运行的本地全栈个人事务管理项目，围绕 `事件 / 人际 / 资金 / 日历` 四条主线组织生活信息。

当前版本不是只读前端原型，而是：
- `React + Vite` 前端界面
- `Node.js + Express` 本地后端
- `runtime-data/lifedesk.sqlite` 本地 SQLite 持久化

也就是说，你从 GitHub 拉下来之后，只要按 README 启动，本地看到的功能就是一个真正前后端联动的桌面优先应用。

## 核心功能
- `事件`：按 `学业 / 事业 / 生活` 管理事务，并支持进入详情页编辑已有事件
- `人际`：以人物为主导，先看谁有待办，再进入人物页处理事项
- `资金`：独立展示收入、支出、余额以及与人物/事件的关联
- `日历`：用 GitHub 风格热力图查看每天的任务密度，并点进当天明细
- `设置`：支持中英双语、亮暗模式、字号、7 种主题色，以及重置演示数据

## 已实现能力
- 左侧固定导航工作台布局
- 事件分类页与事件详情编辑
- 人际首页、关系分类页、人物详情页
- 新增人物并写入本地后端数据文件
- 完成人际待办后自动递减红点计数
- 资金首页与资金记录详情
- 日历热力图与当日事件视图
- 本地 SQLite 数据持久化与演示数据重置
- 类型检查、Lint、测试、生产构建

## 技术栈
- React 18
- TypeScript
- Vite
- Express
- Node.js 内置 `node:sqlite`
- Zustand
- Tailwind CSS
- Vitest + Testing Library

## 环境要求
- Node.js `24+`

## 开发启动
先安装依赖：

```bash
npm install
```

再启动前后端联调模式：

```bash
npm run dev:full
```

启动后会同时运行：
- 前端开发服务器：`http://localhost:5173`
- 本地后端接口：`http://localhost:8787`

前端通过 `/api` 代理访问后端，运行时数据会写入：

```bash
runtime-data/lifedesk.sqlite
```

## 生产启动
如果你想在本地直接以“构建后单服务”方式运行：

```bash
npm run build
npm run start
```

然后打开：

```bash
http://localhost:8787
```

## 常用命令
```bash
npm run dev
npm run server
npm run dev:full
npm run check
npm run lint
npm test
npm run build
npm run start
```

## 数据说明
- 首次启动后端时，会自动生成 `runtime-data/lifedesk.sqlite`
- 这个文件就是本地运行时的数据源
- 如果本地还存在旧版 `runtime-data/lifedesk.json`，首次启动会自动迁移进 SQLite
- 点击“重置演示数据”会把数据库恢复为默认种子数据
- `runtime-data/` 已加入 `.gitignore`，不会被误提交到仓库

## 项目结构
```text
api/                Express 本地后端与 SQLite 访问逻辑
runtime-data/       运行期数据库文件（自动生成，默认忽略提交）
src/
  components/       公共组件、布局组件、人际组件
  data/             默认种子数据
  lib/              前端 API 封装
  pages/            页面级组件
  store/            Zustand 状态仓库
  types/            TypeScript 数据模型
  utils/            文案与日期工具
.trae/documents/    正式 PRD 与技术架构文档
```

## 正式文档
- 产品需求文档：`.trae/documents/个人事务管理软件-PRD.md`
- 技术架构文档：`.trae/documents/个人事务管理软件-技术架构.md`

## 提交到 GitHub 前建议
- 补充仓库简介和截图
- 按你的偏好添加 License
- 如果后续要继续升级，可以把当前 SQLite MVP 再迁移到更完整的数据库服务
