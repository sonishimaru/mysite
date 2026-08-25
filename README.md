# グローバル・ビーコン日本版

架空の海外タブロイド紙『THE GLOBAL BEACON』が、実在する日本のニュースを壮大に読み違えて報じる——という設定の**パロディサイト**です。

> ⚠️ **本サイトはフィクションです。** 『THE GLOBAL BEACON』は実在しません。記者・専門家・統計・読者コメントを含むすべての引用は創作であり、実在の個人・企業・団体・行政機関の見解とは一切関係ありません。記事が題材とする出来事や慣習そのものは実在しますが、それらに対する分析はすべて架空です。

企画の詳細は [`docs/企画書.md`](docs/企画書.md) を参照してください。

## 見る

依存もビルドもありません。`index.html` をブラウザで直接開くだけで動きます。

ローカルサーバで見る場合：

```bash
python3 -m http.server 8000
# → http://localhost:8000/
```

## 構成

| パス | 役割 |
|---|---|
| `index.html` | トップ（一面＋記事一覧） |
| `article.html` | 記事ページ。`article.html?id=kyodai-unchi` のように指定 |
| `about.html` | 媒体設定・記者紹介・「ズレた考察」8つの型の解説 |
| `assets/css/style.css` | タブロイド風スタイル |
| `assets/js/site.js` | 描画ロジック（DOM API のみ、`innerHTML` 不使用） |
| `data/site.js` | 媒体設定 |
| `data/articles.js` | 記事データ |

## 記事を追加する

`data/articles.js` にオブジェクトを1つ push するだけです。

```js
window.GB_ARTICLES.push({
  id: "unique-slug",
  kicker: "独占調査",
  headline: "見出し",
  subhead: "副題",
  byline: "ジョナサン・R・ペティグリュー",
  bylineNote: "東京特派員",
  dateline: "TOKYO — 配信",
  lead: "リード文",
  source: "実在の事象をここに明記する",
  tags: ["禅", "武士道"],
  lens: "型1：禅接続 → 型7：本国との比較オチ",
  body: [
    { type: "p",       text: "本文。**ここが強調される**" },
    { type: "subhead", text: "中見出し" },
    { type: "quote",   text: "引用",       cite: "本紙記者" },
    { type: "expert",  name: "Dr. …", affil: "…", text: "専門家コメント" },
    { type: "figure",  caption: "関連画像：東京の通勤客（2019年撮影）" },
    { type: "stat",    value: "138万分", label: "見出し", note: "出典：…" }
  ],
  editorNote: "本記事は架空の…",
  comments: [{ user: "…", country: "🇯🇵 日本", text: "…", likes: 100 }]
});
```

`source`（元ネタ欄）と `editorNote`（編集部注）は**必須**です。実在の事象への誤解を防ぐための装置なので、省略しないでください。
