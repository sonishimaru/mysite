# scrapbox-shot

⌘ダブルタップ（⌘⌘）でスクリーンショットを撮り、Gyazo にアップロードして、
その画像を貼った Scrapbox（Cosense）ページを作成・保存する macOS 用ツール。

```
⌘⌘ → screencapture → Gyazo Upload API → scrapbox.io/<project>/<title>?body=...
```

本体は bash スクリプト 1 本で、macOS 標準の `bash` / `curl` / `screencapture` /
`open` / `od` しか使いません。ホットキー（⌘ダブルタップ）の検出だけ
[Hammerspoon](https://www.hammerspoon.org/) に任せています。

## セットアップ

1. Hammerspoon をインストール（`brew install --cask hammerspoon`）。
2. Gyazo のアクセストークンを取得。
   https://gyazo.com/oauth/applications でアプリを作り、access token をコピー。
   Scrapbox の画像はもともと Gyazo でホストされているので、これが正規ルートです。
3. インストール:

   ```sh
   ./install.sh
   ```

   `~/.local/bin/scrapbox-shot` と `~/.hammerspoon/scrapbox-shot.lua` に
   symlink を張り、`~/.config/scrapbox-shot/config` を作ります。

4. `~/.config/scrapbox-shot/config` を編集して `SCRAPBOX_PROJECT` と
   `GYAZO_ACCESS_TOKEN` を埋める。
5. `~/.hammerspoon/init.lua` に追記:

   ```lua
   local scrapboxShot = dofile(os.getenv("HOME") .. "/.hammerspoon/scrapbox-shot.lua")
   scrapboxShot.start()
   ```

6. Hammerspoon の設定をリロード。

### 必要な権限

`screencapture` を実行するのは Hammerspoon の子プロセスなので、TCC の許可は
**Hammerspoon.app に対して**必要です。システム設定 → プライバシーとセキュリティで:

- **アクセシビリティ** — キーイベントを監視するため（Hammerspoon 必須）
- **画面収録** — スクリーンショットを撮るため

どちらも許可後に Hammerspoon を再起動してください。

ブラウザが Scrapbox にログイン済みである必要もあります（ページ作成はブラウザ
セッションで行われるため）。

## 使い方

**⌘を素早く2回**。クロスヘアが出るので範囲を選択すると、アップロードののち
Scrapbox のページがバックグラウンドタブで開いて自動保存されます。

誤爆しないよう、以下は「タップ」として数えません:

- 他の修飾キーと一緒に押した⌘（⌘⇧4 など）
- ⌘を押している間に何かキーを押した場合（⌘C ⌘C など）

つまり「他のキーを一切押さない素の⌘の押して離す」が 0.4 秒以内に 2 回来たときだけ発火します。

### CLI として

```sh
scrapbox-shot                         # 範囲選択して投稿
scrapbox-shot --mode window           # ウィンドウを選んで投稿
scrapbox-shot --mode screen           # メインディスプレイ全体
scrapbox-shot -f shot.png -t "設計メモ" -n "ここのレイアウトが気になる"
scrapbox-shot --dry-run               # 何が作られるか確認（アップロードしない）
```

終了コード: `0` 成功 / `1` エラー / `2` キャンセル。

### 生成されるページ

タイトル: `2026-09-15 12:34:56 - Safari`（`TITLE_PREFIX` / `TITLE_DATE_FORMAT` で変更可）

```
[https://i.gyazo.com/xxxxxxxx.png]

from: Safari / Example Domain
gyazo: https://gyazo.com/xxxxxxxx
[2026/09/15]
#screenshot
```

`[2026/09/15]` は Scrapbox のリンクなので、日付ページから当日のショットが
一覧できます。`#screenshot` は `PAGE_TAGS` で変更・無効化できます。

## 設定

`~/.config/scrapbox-shot/config`（bash として source される）。
項目は [`config.example`](config.example) を参照。よく触るもの:

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `SCRAPBOX_PROJECT` | （必須） | プロジェクト名 |
| `GYAZO_ACCESS_TOKEN` | （必須） | Gyazo のアクセストークン |
| `CAPTURE_MODE` | `interactive` | `interactive` / `window` / `screen` |
| `ARCHIVE_DIR` | `~/Pictures/ScrapboxShots` | ローカル控えの保存先。空なら保存しない |
| `PAGE_TAGS` | `#screenshot` | 本文末尾に付けるタグ |
| `OPEN_IN_BACKGROUND` | `1` | `1` なら裏タブで開いて作業を中断しない |

Hammerspoon 側は `scrapbox-shot.lua` の先頭で調整します:

```lua
scrapboxShot.modifier = "alt"          -- ⌥⌥ にする
scrapboxShot.doubleTapInterval = 0.3   -- 判定を厳しく
scrapboxShot.captureMode = "window"    -- 設定ファイルより優先
scrapboxShot.start()
```

普通のホットキーも併用できます:

```lua
hs.hotkey.bind({"cmd", "shift"}, "8", scrapboxShot.capture)
```

## 仕組みと制約

- **ページ作成は `?body=` URL スキーム**を使っています。Scrapbox の
  `https://scrapbox.io/<project>/<title>?body=<text>` を開くと、その本文で
  ページが作られて自動保存されます。公式にサポートされた方法で、
  非公式 API やセッション Cookie を持ち出す必要がありません。
  代わりにブラウザが一瞬開くことは避けられません（`OPEN_IN_BACKGROUND=1`
  なら裏で開くのでフォーカスは奪われません）。
- **画像は Gyazo 経由**。Scrapbox に画像を直接アップロードする公開 API は
  なく、エディタ上のドラッグ＆ドロップも内部的には Gyazo に上げています。
- タイトルの `/` は Scrapbox のパス区切りなので `-` に置換されます。
- URL エンコードはバイト単位で行うので、日本語タイトル・日本語メモも通ります。

## テスト

⌘ダブルタップの判定は macOS 上でしか実行できないので、`hs` をスタブ化して
状態機械だけを検証するテストがあります（Lua 5.x が必要）。

```sh
lua test/test_doubletap.lua
```

スクリプト側は `--dry-run` で、アップロードもページ作成もせずに
生成されるタイトル・本文・URL を確認できます。

```sh
./bin/scrapbox-shot --dry-run --file some.png --app Safari
```

## Hammerspoon を使いたくない場合

⌘ダブルタップの検出だけが Hammerspoon 依存です。`scrapbox-shot` 自体は
ただの CLI なので、他のランチャからも呼べます:

- **Karabiner-Elements** — 複雑な修飾キー操作を `shell_command` に割り当てる
- **Raycast / Alfred** — スクリプトコマンドとして登録し、任意のホットキーを割当
- **BetterTouchTool** — トラックパッドジェスチャに割当

ただし「修飾キーのダブルタップ」を素直に扱えるのは Hammerspoon か
Karabiner-Elements です。
