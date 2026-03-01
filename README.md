# LIFELOG.SYS

按你提供的 `blog.html` 设计稿直接落地的 Next.js 15 全栈项目。

## 技术栈

- 前端：Next.js 15 (App Router), React 19, TailwindCSS, shadcn/ui
- 内容渲染：react-markdown + remark-gfm + rehype
- 图表：Recharts + Lightweight Charts
- 地图：Leaflet
- 后端：Next.js API Routes
- 数据库：Prisma + PostgreSQL
- 对象存储：MinIO（S3 兼容）+ Sharp

## 路由

- `/`：重定向到原始设计稿页面
- `/blog.html`：你提供的页面（原样接入）
- `/studio`：全栈功能工作台（Markdown/地图/统计/K线）
- `/login`：管理员登录
- `/admin`：管理后台（写博客、旅游、健身、食物、理财）
- `/chat`：Grok 聊天/生图/视频生成

## API

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET/POST /api/posts`
- `GET/POST /api/travel-locations`
- `GET/POST /api/travel-photos`
- `GET/POST /api/fitness-plans`
- `GET/POST /api/fitness-records`
- `GET/POST /api/food-records`
- `GET/POST /api/fund-accounts`
- `GET/POST /api/fund-transactions`
- `POST /api/upload`
- `POST /api/grok`
- `GET /api/health`

说明：所有写入接口（POST）默认需要管理员登录 Cookie。

## 本地运行

```bash
npm install
npm run prisma:generate
npm run dev
```

## Docker 运行

```bash
docker compose up --build
```

启动后：

- App: http://localhost:3000
- MinIO API: http://localhost:9000
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432

## 环境变量

复制 `.env.example` 为 `.env.local`（本地开发）或使用 `.env.docker`（Docker 编排）。

关键变量：

- `ADMIN_USERNAME` / `ADMIN_PASSWORD`：管理员账号密码
- `AUTH_SECRET`：登录签名密钥
- `GROK_API_KEY`：xAI/Grok API key
- `GROK_CHAT_MODEL` / `GROK_IMAGE_MODEL` / `GROK_VIDEO_MODEL`：模型名
