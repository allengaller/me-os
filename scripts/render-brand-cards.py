#!/usr/bin/env python3
"""黑屏白字静态资产渲染器（品牌 VI：docs/INTERVIEW_PLAYBOOK.md 第四章）

用法：
    python3 scripts/render-brand-cards.py            # 渲染全部
    python3 scripts/render-brand-cards.py --list     # 只看资产清单
    python3 scripts/render-brand-cards.py ep000-cover-horizontal ep000-quote

设计约束（v1 资产踩过的坑，改动前先读）：
1. 版式按「纵向分栏 + 安全区」布局，装饰性巨型字（hero）永远只占自己的栏，
   不与标题/slogan 共栏——v1 的 cover-001 与 opener-001 都是因为 hero 无栏位
   而压住了底部 slogan，白字叠白字直接不可读。
2. hero 用暗灰（HERO_GRAY）而非纯白：它是「氛围」不是「内容」，
   白字要能压在它上面读（playbook 4.4「30% 暗化的黑金底」）。
3. 字号自动缩到栏宽以内，不靠手调数字；输出确定性（同输入同像素），
   方便 diff 与重跑。
4. 本机无思源黑体，用 Hiragino Sans GB W6 + 描边模拟 Bold；
   正式版仍建议在剪映内用思源黑体重排（playbook 4.4 字重说明）。
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "assets" / "brand"

FONT_CJK_BOLD = "/System/Library/Fonts/Hiragino Sans GB.ttc"  # index 2 = W6
FONT_CJK_REGULAR = "/System/Library/Fonts/STHeiti Medium.ttc"  # index 1 = Heiti SC Medium
FONT_INDEX_BOLD, FONT_INDEX_REGULAR = 2, 1

BG = (0, 0, 0)
WHITE = (255, 255, 255)
DIM = (150, 150, 150)
HERO_GRAY = (46, 46, 46)

SLOGAN = "走出空调房，去泥土里找答案。"


# ── 排版原语 ─────────────────────────────────────────────────


@dataclass
class Band:
    """一块纵向栏位：y 为画面高度比例，x_pad 为左右留白比例。"""

    top: float
    bottom: float
    x_pad: float = 0.08
    align: str = "center"  # center | left


def load_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path, index = (
        (FONT_CJK_BOLD, FONT_INDEX_BOLD) if bold else (FONT_CJK_REGULAR, FONT_INDEX_REGULAR)
    )
    return ImageFont.truetype(path, size, index=index)


def stroke_for(size: int) -> int:
    """W6 仍不够黑，用同色描边补到接近思源 Bold。"""
    return max(1, round(size * 0.022))


def fit_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    band: Band,
    width: int,
    height: int,
    bold: bool = True,
    max_size: int = 400,
) -> tuple[ImageFont.FreeTypeFont, int]:
    """二分找最大字号：整块文字宽度与高度都塞得进栏位。"""
    avail_w = int(width * (1 - 2 * band.x_pad))
    avail_h = int(height * (band.bottom - band.top))

    def block_fits(size: int) -> bool:
        font = load_font(size, bold)
        # textlength 不吃 stroke_width，描边宽度按左右各一份手工计入
        sw = stroke_for(size) if bold else 0
        widest = max(font.getlength(t) for t in lines) + 2 * sw
        leading = round(size * 1.32)
        total_h = leading * (len(lines) - 1) + size
        return widest <= avail_w and total_h <= avail_h

    lo, hi = 12, min(max_size, avail_h)
    if not block_fits(lo):
        return load_font(lo, bold), round(lo * 1.32)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if block_fits(mid):
            lo = mid
        else:
            hi = mid - 1
    return load_font(lo, bold), round(lo * 1.32)


def draw_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    band: Band,
    width: int,
    height: int,
    fill=WHITE,
    bold: bool = True,
    max_size: int = 400,
    anchor_top: bool = False,
) -> int:
    """在栏位内绘制多行文字，返回实际字号。"""
    font, leading = fit_lines(draw, lines, band, width, height, bold, max_size)
    sw = stroke_for(font.size) if bold else 0
    block_h = leading * (len(lines) - 1) + font.size
    band_top = int(height * band.top)
    band_h = int(height * (band.bottom - band.top))
    block_top = band_top if anchor_top else band_top + (band_h - block_h) // 2
    left = int(width * band.x_pad)
    # anchor="mm"/"lm" 传的是文字垂直中心线，不是顶边
    y = block_top + font.size // 2
    for line in lines:
        if band.align == "left":
            x = left
        else:
            x = width // 2
        draw.text(
            (x, y),
            line,
            font=font,
            fill=fill,
            stroke_width=sw,
            stroke_fill=fill,
            anchor=("lm" if band.align == "left" else "mm"),
        )
        y += leading
    return font.size


def draw_hero(
    draw: ImageDraw.ImageDraw, glyph: str, band: Band, width: int, height: int
) -> None:
    """装饰性巨型暗灰字（占独立栏，不与内容字共栏）。"""
    draw_lines(draw, [glyph], band, width, height, fill=HERO_GRAY, bold=True, max_size=2000)


# ── 资产清单 ─────────────────────────────────────────────────


@dataclass
class Card:
    name: str
    filename: str
    size: tuple[int, int]
    note: str
    hero: tuple[str, Band] | None = None
    lines: list[tuple[list[str], Band, dict]] = field(default_factory=list)

    def render(self) -> Path:
        width, height = self.size
        image = Image.new("RGB", self.size, BG)
        draw = ImageDraw.Draw(image)
        if self.hero:
            draw_hero(draw, self.hero[0], self.hero[1], width, height)
        for text, band, kwargs in self.lines:
            draw_lines(draw, text, band, width, height, **kwargs)
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        path = OUT_DIR / self.filename
        image.save(path)
        return path


H, V = (1920, 1080), (1080, 1920)

CARDS: list[Card] = [
    # ── EP00《发刊词》 ────────────────────────────────────────
    Card(
        "ep000-cover-horizontal",
        "ep000-cover-horizontal.png",
        H,
        "B站第 0 期封面（横屏）",
        hero=("野", Band(0.02, 0.98)),
        lines=[
            (["曹亚仑 · EP00"], Band(0.07, 0.19, x_pad=0.06, align="left"), {"max_size": 92}),
            (
                ["AI 拉平了制作，", "没拉平真实经历。"],
                Band(0.30, 0.62),
                {"max_size": 190},
            ),
            ([SLOGAN], Band(0.78, 0.90, x_pad=0.05), {"fill": DIM, "max_size": 76}),
        ],
    ),
    Card(
        "ep000-cover-vertical",
        "ep000-cover-vertical.png",
        V,
        "抖音／视频号第 0 期封面（竖屏，避开平台 UI 安全区）",
        hero=("野", Band(0.14, 0.80)),
        lines=[
            (["曹亚仑 · EP00"], Band(0.06, 0.13, x_pad=0.09, align="left"), {"max_size": 84}),
            (
                ["AI 拉平了制作，", "没拉平真实经历。"],
                Band(0.36, 0.62),
                {"max_size": 170},
            ),
            ([SLOGAN], Band(0.83, 0.90, x_pad=0.07), {"fill": DIM, "max_size": 66}),
        ],
    ),
    Card(
        "ep000-opener",
        "ep000-opener.png",
        V,
        "定场卡静态预览（O1；动态版按 playbook 4.1 打字机做）",
        lines=[
            (["曹亚仑"], Band(0.34, 0.46), {"max_size": 200}),
            (["走出空调房，", "去泥土里找答案。"], Band(0.48, 0.66), {"max_size": 120}),
        ],
    ),
    Card(
        "ep000-quote",
        "ep000-quote.png",
        H,
        "金句卡（O8 片尾；淡入 1.5s）",
        lines=[
            (["AI 拉平了制作，", "没有拉平真实经历。"], Band(0.22, 0.66), {"max_size": 170}),
            (["曹亚仑 · EP00"], Band(0.74, 0.84), {"fill": DIM, "max_size": 70}),
        ],
    ),
    Card(
        "ep000-quote-vertical",
        "ep000-quote-vertical.png",
        V,
        "金句卡竖版（抖音／视频号）",
        lines=[
            (["AI 拉平了制作，", "没有拉平真实经历。"], Band(0.34, 0.62), {"max_size": 160}),
            (["曹亚仑 · EP00"], Band(0.70, 0.76), {"fill": DIM, "max_size": 70}),
        ],
    ),
    Card(
        "ep000-index-1",
        "ep000-index-1.png",
        V,
        "序号卡 一（O6 第一层：AI 拉平制作）",
        lines=[
            (["新田野调查"], Band(0.38, 0.48), {"max_size": 130}),
            (["一"], Band(0.48, 0.62), {"max_size": 300}),
        ],
    ),
    Card(
        "ep000-index-2",
        "ep000-index-2.png",
        V,
        "序号卡 二（O6 第二层：没有 AI 一个人做不成）",
        lines=[
            (["新田野调查"], Band(0.38, 0.48), {"max_size": 130}),
            (["二"], Band(0.48, 0.62), {"max_size": 300}),
        ],
    ),
    Card(
        "ep000-index-3",
        "ep000-index-3.png",
        V,
        "序号卡 三（O6 第三层：田野是 AI 的校准器）",
        lines=[
            (["新田野调查"], Band(0.38, 0.48), {"max_size": 130}),
            (["三"], Band(0.48, 0.62), {"max_size": 300}),
        ],
    ),
    # ── 田野日志 001《园丁》（v1 版式压字，重排修可读性）────────
    Card(
        "cover-001-horizontal",
        "cover-001-horizontal.png",
        H,
        "B站 001 封面（横屏）｜v2 修正：hero 不再压住底部 slogan",
        hero=("田", Band(0.02, 0.98)),
        lines=[
            (["FDE 田野日志 001"], Band(0.07, 0.19, x_pad=0.06, align="left"), {"max_size": 92}),
            (["第 001 次实地部署", "去见园丁。"], Band(0.30, 0.62), {"max_size": 190}),
            ([SLOGAN], Band(0.78, 0.90, x_pad=0.05), {"fill": DIM, "max_size": 76}),
        ],
    ),
    Card(
        "cover-001-vertical",
        "cover-001-vertical.png",
        V,
        "抖音／视频号 001 封面（竖屏）｜v2 修正同上",
        hero=("田", Band(0.14, 0.80)),
        lines=[
            (["FDE 田野日志 001"], Band(0.06, 0.13, x_pad=0.09, align="left"), {"max_size": 84}),
            (["我带着 AI，", "去采访了", "小区园丁"], Band(0.34, 0.58), {"max_size": 170}),
            ([SLOGAN], Band(0.83, 0.90, x_pad=0.07), {"fill": DIM, "max_size": 66}),
        ],
    ),
    Card(
        "opener-001",
        "opener-001.png",
        V,
        "001 定场卡静态预览｜v2 修正：竖排巨名与 slogan 重叠",
        lines=[
            (["曹亚仑"], Band(0.34, 0.46), {"max_size": 200}),
            (["走出空调房，", "去泥土里找答案。"], Band(0.48, 0.66), {"max_size": 120}),
        ],
    ),
    Card(
        "avatar",
        "avatar.png",
        (1080, 1080),
        "全平台头像（黑底白字竖排，与字卡视觉同源）",
        lines=[(["曹", "亚", "仑"], Band(0.06, 0.94, x_pad=0.20), {"max_size": 400})],
    ),
]


def main() -> int:
    parser = argparse.ArgumentParser(description="渲染品牌黑屏白字静态资产")
    parser.add_argument("names", nargs="*", help="只渲染指定资产名（默认全部）")
    parser.add_argument("--list", action="store_true", help="打印资产清单")
    args = parser.parse_args()

    if args.list:
        for card in CARDS:
            print(f"{card.name:28} {card.size[0]}x{card.size[1]:5}  {card.filename:32} {card.note}")
        return 0

    wanted = set(args.names)
    selected = [c for c in CARDS if not wanted or c.name in wanted or c.filename in wanted]
    if not selected:
        known = ", ".join(c.name for c in CARDS)
        print(f"没有匹配的资产。可用：{known}", file=sys.stderr)
        return 1
    for card in selected:
        print(f"✓ {card.render().relative_to(ROOT)}  {card.size[0]}x{card.size[1]}")
    print(f"\n共 {len(selected)} 张 → {OUT_DIR.relative_to(ROOT)}/")
    print("字重为 Hiragino W6 + 描边模拟；正式版在剪映内用思源黑体重排（playbook 4.4）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
