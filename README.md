# AI 换发型网页 MVP

这是一个基于 Next.js、TypeScript、React、Tailwind CSS 和 OpenAI Node SDK 的网页版 AI 换发型 MVP。

用户可以上传一张人像照片，手动选择预设发型，或点击“AI 帮我推荐”从内置发型库中获得 3-5 个建议。选择发型后，系统会通过服务端 API 调用 OpenAI 图像编辑接口生成发型预览。用户还可以上传发型参考图、手动画出头发区域作为 mask，并自定义发色，让生成结果更贴近目标风格。未配置 API key 时会进入 mock 模式，方便本地开发和演示交互流程。

## 安装依赖

```bash
npm install
```

## 配置 OPENAI_API_KEY

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填写：

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

可选配置：

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_VISION_MODEL=gpt-4.1-mini
OPENAI_IMAGE_ENDPOINT=images_edit
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=high
OPENAI_IMAGE_OUTPUT_FORMAT=png
```

如果使用 OpenAI 兼容中转站，把 `OPENAI_BASE_URL` 改成中转站提供的 API 地址，并把模型名改成中转站支持的模型名。例如：

```bash
OPENAI_BASE_URL=https://你的中转站地址/v1
OPENAI_IMAGE_MODEL=中转站图像编辑模型名
OPENAI_VISION_MODEL=中转站视觉模型名
OPENAI_IMAGE_ENDPOINT=images_edit
```

`OPENAI_IMAGE_ENDPOINT` 可选值：

- `images_edit`：默认模式，使用 OpenAI 兼容的 `/images/edits` 接口，原生支持 `mask`。
- `chat_completions`：适配部分中转站把图片模型挂在 `/chat/completions` 的情况。系统会把原图和 mask 作为输入图片发给模型，并从回复中提取 `data:image/...` 结果。这个模式依赖模型按提示遵守 mask，精准度通常不如原生 `/images/edits`。

中转站如果只支持聊天接口，可以尝试：

```bash
OPENAI_BASE_URL=https://aitechflux.com/v1
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_ENDPOINT=images_edit
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=high
OPENAI_IMAGE_OUTPUT_FORMAT=png
```

AI 推荐接口仍使用 `/responses`。如果中转站不支持 `/responses`，AI 推荐可能失败，但不影响手动选择发型生成。

## 运行开发环境

```bash
npm run dev
```

默认访问：

```bash
http://localhost:3000
```

## 如何使用

1. 打开首页，上传 JPG、PNG 或 WebP 人像图片，最大 10MB。
2. 可选上传一张“发型参考图”，它只用于参考头发轮廓、长度、卷曲程度、层次、刘海和整体风格。
3. 上传后，在“手动画出头发区域”里用画笔涂抹头发区域；涂错可以切到橡皮或清空重画。
4. 在“发色设置”中选择预设发色、调色盘颜色、HEX 色值、染发模式、饱和度和明度。
5. 从发型库选择一个发型，或点击“AI 帮我推荐”。
6. AI 推荐会展示在上传图下方，可一键选择推荐发型。
7. 点击“生成发型预览”。
8. 生成完成后，可以对比原图、发型参考图和生成图，并下载结果。

页面里的“生成质量”可在快速、标准、高清之间切换。它会覆盖当前请求的 `OPENAI_IMAGE_QUALITY` 默认值，不需要重启服务。

## 发型参考图说明

发型参考图是可选的。如果上传了参考图，系统会优先使用“参考图驱动”生成模式：

- 主体始终是用户本人照片。
- 保留用户的脸、五官、肤色、表情、衣服、背景、光照和身份特征。
- 不复制参考图人物的脸、五官、衣服、背景或身份。
- 只参考参考图中的头发结构、轮廓、长度、卷曲程度、层次、刘海形状和整体风格。

如果既选择了预设发型又上传了参考图，参考图为主，预设发型只作为辅助风格提示。

## 自定义发色说明

“发色设置”支持：

- 预设发色：自然黑、黑茶色、深棕色、冷棕色、奶茶棕、亚麻棕、灰棕色、酒红色、蓝黑色、浅金色。
- 调色盘 color picker。
- HEX 输入框，例如 `#7A4B32`。
- 染发模式：整体染色、低调自然染、挑染、渐变染、挂耳染。
- 高级参数：饱和度 saturation、明度 lightness。

如果上传了发型参考图，可以开启“使用参考图原始发色”。开启后，prompt 会要求发色也参考参考图；关闭后，prompt 会明确写入目标 HEX 发色和染发模式。

## 生成后本地发色编辑

第一次生成换发型结果后，页面会显示“发色编辑”模块。这里的快速预览不会调用 AI，而是在浏览器本地用 Canvas 处理图片：

1. 在生成图上用画笔涂抹头发区域，形成 hair mask。
2. 通过预设发色、调色盘或 HEX 输入选择目标发色。
3. 切换自然、中等、鲜明三种颜色强度。
4. 前端读取原图像素和 mask alpha，把头发区域的 HSL 色相向目标色靠近，同时保留原始亮度、阴影、高光和发丝纹理。
5. mask 边缘会做羽化过渡，避免硬边。

这个本地算法适合快速预览，优点是免费、实时、不消耗 API；限制是它依赖手动画出的 hair mask，复杂光照、极浅发色或遮挡较多时可能不如 AI 自然。

“AI 精修发色”是可选按钮，只有点击时才会调用 `POST /api/edit-hair-color`。它会上传当前预览图、hair mask、目标发色和颜色强度，并要求模型只改变头发颜色，不改变发型形状、脸、衣服、背景或光照。如果 AI 精修失败，页面会保留本地 Canvas 预览结果。

## Mask 精准编辑说明

前端会把用户画出的头发区域导出为 PNG mask，并随 `userImage`、`hairstyleId`、`hairstyleReferenceImage` 和发色参数一起提交到 `POST /api/hairstyle`。

OpenAI 图像编辑接口要求 mask 和原图尺寸一致，且透明区域表示需要编辑的位置。因此本项目导出的 mask 会把用户画过的区域转换为透明，把其他区域保持不透明。这样可以让模型优先只编辑头发区域，减少脸部、五官、衣服和背景被改动的概率。

如果用户没有绘制 mask，系统仍会按原流程生成，并依赖 prompt 中“只修改头发区域”的约束。

## API key 安全说明

OpenAI API key 只能放在服务端环境变量 `OPENAI_API_KEY` 中。前端页面不会读取、传输或暴露 API key。所有 OpenAI 调用都在 Next.js API Route 中完成：

- `POST /api/hairstyle`
- `POST /api/recommend-hairstyles`
- `POST /api/edit-hair-color`

不要把真实 API key 写入前端代码、Git 仓库或公开配置文件。

## Mock 模式说明

如果没有配置 `OPENAI_API_KEY`：

- `/api/recommend-hairstyles` 会返回内置 mock 推荐。
- `/api/hairstyle` 会返回原图 data URL 作为 mock 生成结果；如果提交了 mask，响应会标记 `usedMask: true`。

这样可以在没有 OpenAI key 的情况下完整跑通上传、推荐、选择、生成、对比和下载流程。

## 后续可扩展功能

- 增加自动头发分割，减少用户手动画 mask 的成本。
- 增加登录、用户作品历史和生成记录。
- 增加次数限制、队列、风控和支付。
- 增加更多发型分类、发色组合和收藏功能。
- 接入对象存储，保存用户主动确认的生成结果。
- 增加微信小程序版本。
- 加入前后对比滑杆、批量生成和多候选图选择。
