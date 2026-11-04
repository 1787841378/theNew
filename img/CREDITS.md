# 图片来源与授权 · Image credits

本页所有照片均来自 [Pexels](https://www.pexels.com/)，遵循 [Pexels License](https://www.pexels.com/license/)：
可免费用于个人与商业项目、可修改，无需署名（本项目仍在此列出作者以示尊重）。

| 文件 | 用途 | 作者 | 原图页面 | 直接下载地址 |
| --- | --- | --- | --- | --- |
| `hero-cube.jpg` | 「魔方并没有那么难」通栏引言 | Varun Gaba | [pexels.com/photo/7437951](https://www.pexels.com/photo/close-up-shot-of-a-rubiks-cube-7437951/) | [images.pexels.com](https://images.pexels.com/photos/7437951/pexels-photo-7437951.jpeg) |
| `cube-clean.jpg` | 「认识魔方」实物参考 | Miguel Á. Padriñán | [pexels.com/photo/19677](https://www.pexels.com/photo/yellow-orange-and-green-3x3-rubik-s-cube-19677/) | [images.pexels.com](https://images.pexels.com/photos/19677/pexels-photo.jpg) |
| `cube-stack.jpg` | 底部「开始学习」行动区背景 | Engin Akyurt | [pexels.com/photo/10285256](https://www.pexels.com/photo/close-up-shot-of-rubiks-cube-10285256/) | [images.pexels.com](https://images.pexels.com/photos/10285256/pexels-photo-10285256.jpeg) |

## 处理方式

- 统一裁切为目标比例，使用 Pillow 缩放并以 progressive JPEG 重新编码（quality 78–82），单张 ≤ 160 KB。
- 页面中通过 CSS 叠加渐变遮罩、调节亮度/饱和度，未改动原图内容。

## 其他图形

| 文件 | 说明 |
| --- | --- |
| `logo-on-dark.png` / `logo-on-light.png` | 由项目原有 `img/logo.png`（实际为 WEBP 编码）转出，去除白底、裁去留白，分别用于深色 / 浅色背景 |
| `assets/diagrams/cube-layers.svg` | 为本页手绘生成的三层结构等距示意图（脚本 `.work/gen_layers.py`） |
| `assets/favicon.svg` | 站点图标，纯 SVG 绘制 |
| `img/sanjie*.png`、`img/mffyg.png`、`img/logo.png` 等 | 项目原始素材，保留未改动 |
