# 找物分类

七关找物分类游戏。网页玩法使用 Phaser，iOS 工程使用 Capacitor。应用 ID 是 `com.wanlihua.findandsort`，显示名称是“找物分类”。

## 本地运行

需要 Node.js 22 或更新版本。

```bash
npm ci
npm run dev
```

`npm test` 检查关卡配额、遮挡关系和五格通关路径；`npm run build` 生成网页资源。

## iOS 打包

需要 macOS、Xcode 26 或更新版本，以及 Apple 开发者账号。本仓库已包含 `ios/` 原生工程、图标和启动图。

```bash
npm ci
npm run ios:sync
npx cap open ios
```

在 Xcode 中选择 `App` target，设置 Signing & Capabilities 的 Team，并确认 Bundle Identifier 为 `com.wanlihua.findandsort`。先在模拟器和真机检查点击、拖动、音乐导入和进度恢复；然后使用 Product > Archive，通过 Organizer 导出或上传构建。Windows 可以准备和同步工程，但无法运行 Xcode、签名或导出 `.ipa`。

更改图标源图 `assets/app-icon.svg` 后，运行 `npm run art:app` 和 `npx capacitor-assets generate --ios`。

## 私有照片

公开仓库不含第 6、7 关的真人照片。直接克隆并构建时，这两关使用仓库内的绘制背景。要在自己的 iOS 包中加入用户提供的照片：

1. 将裁剪后的照片分别放在 `public/assets/people/gym-photo-1.jpg` 和 `gym-photo-2.jpg`；这两个文件不会被 Git 提交。
2. 运行 `npm run art:gym` 生成两张合成背景图。
3. 在本机新建 `.env.local`，写入 `VITE_PRIVATE_PHOTOS=true`，再运行 `npm run ios:sync`。

原始人物照片、合成图、本地开关以及同步到 `ios/App/App/public/` 的网页资源都不会进入 Git。发布应用前需确认照片的使用权。

## 素材

物品图使用 MIT 授权的 Microsoft Fluent Emoji，许可文件见 `public/assets/fluent-emoji/LICENSE`；完整来源见 `docs/asset-sources.md`。
