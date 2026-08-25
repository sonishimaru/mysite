/* ===========================================================
   THE GLOBAL BEACON 日本版 — 描画ロジック
   ビルド不要。data/*.js のグローバル変数から DOM を組み立てる。
   =========================================================== */
(function () {
  "use strict";

  var SITE = window.GB_SITE || {};
  var ARTICLES = window.GB_ARTICLES || [];

  /* ---------- 小さなDOMヘルパ ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function frag() { return document.createDocumentFragment(); }

  /* `**強調**` だけを解釈する軽量インライン記法。
     textContent 経由で組むので、データ側にHTMLを書いても描画されない。 */
  function rich(str) {
    var f = frag();
    String(str).split("**").forEach(function (chunk, i) {
      if (!chunk) return;
      if (i % 2 === 1) f.appendChild(el("strong", null, chunk));
      else f.appendChild(document.createTextNode(chunk));
    });
    return f;
  }

  function link(href, text) {
    var a = el("a", null, text);
    a.href = href;
    return a;
  }

  function byId(id) {
    for (var i = 0; i < ARTICLES.length; i++) {
      if (ARTICLES[i].id === id) return ARTICLES[i];
    }
    return null;
  }

  function tagList(tags) {
    var ul = el("ul", "tags");
    (tags || []).forEach(function (t) { ul.appendChild(el("li", "tag", t)); });
    return ul;
  }

  /* ---------- 全ページ共通の枠 ---------- */
  function renderChrome(currentPage) {
    var bar = document.querySelector(".parody-bar");
    if (bar) {
      bar.textContent = "";
      bar.appendChild(el("b", null, "PARODY"));
      bar.appendChild(document.createTextNode("　" + SITE.parodyNotice));
    }

    var head = document.getElementById("masthead");
    if (head) {
      var nameH = el("p", "masthead__name");
      nameH.appendChild(link("index.html", SITE.nameEn));
      head.appendChild(nameH);
      head.appendChild(el("p", "masthead__ja", SITE.nameJa + " " + SITE.editionJa));

      var rule = el("div", "masthead__rule");
      rule.appendChild(el("span", null, "創刊 " + SITE.founded));
      rule.appendChild(el("span", null, SITE.mottoEn));
      rule.appendChild(el("span", null, "発行部数 " + SITE.circulation));
      head.appendChild(rule);
    }

    var nav = document.getElementById("nav");
    if (nav) {
      [["index.html", "一面", "index"],
       ["index.html#archive", "記事一覧", null],
       ["about.html", "本紙について", "about"]].forEach(function (item) {
        var a = link(item[0], item[1]);
        if (item[2] && item[2] === currentPage) a.setAttribute("aria-current", "page");
        nav.appendChild(a);
      });
    }

    var foot = document.getElementById("colophon");
    if (foot) {
      var w = el("div", "wrap");
      w.appendChild(el("p", "colophon__motto", SITE.mottoEn + " —— " + SITE.mottoJa));
      w.appendChild(el("p", null, SITE.nameJa + " " + SITE.editionJa + "／" + SITE.tagline));
      w.appendChild(el("p", "colophon__notice", SITE.parodyNotice));
      foot.appendChild(w);
    }
  }

  /* ---------- トップページ ---------- */
  function renderIndex() {
    var host = document.getElementById("main");
    if (!host || !ARTICLES.length) return;

    var top = ARTICLES[0];

    var lead = el("section", "lead-story");
    lead.appendChild(el("span", "kicker", top.kicker));
    var h1 = el("h1", "lead-story__headline");
    h1.appendChild(link("article.html?id=" + encodeURIComponent(top.id), top.headline));
    lead.appendChild(h1);
    lead.appendChild(el("p", "lead-story__sub", top.subhead));
    lead.appendChild(el("p", "lead-story__lead", top.lead));
    host.appendChild(lead);

    var title = el("h2", "section-title", "そのほかの報道");
    title.id = "archive";
    host.appendChild(title);

    var grid = el("div", "cards");
    ARTICLES.slice(1).forEach(function (a) {
      var c = el("article", "card");
      c.appendChild(el("p", "card__kicker", a.kicker));
      var h = el("h3", "card__headline");
      h.appendChild(link("article.html?id=" + encodeURIComponent(a.id), a.headline));
      c.appendChild(h);
      c.appendChild(el("p", "card__sub", a.subhead));
      c.appendChild(tagList(a.tags));
      c.appendChild(el("p", "card__meta", a.byline + "／" + a.dateline));
      grid.appendChild(c);
    });

    /* 最後の升目に本紙紹介を差し込み、紙面の余白を埋める */
    var promo = el("article", "card");
    promo.appendChild(el("p", "card__kicker", "社告"));
    var ph = el("h3", "card__headline");
    ph.appendChild(link("about.html", "本紙の読み方について"));
    promo.appendChild(ph);
    promo.appendChild(el("p", "card__sub",
      "『ズレた考察』を生む8つの型、記者の顔ぶれ、そして本紙が自らに課した禁止事項。"));
    promo.appendChild(el("p", "card__meta", "編集部"));
    grid.appendChild(promo);

    host.appendChild(grid);
  }

  /* ---------- 記事ページ ---------- */
  var BLOCKS = {
    p: function (b) {
      var p = el("p");
      p.appendChild(rich(b.text));
      return p;
    },
    subhead: function (b) { return el("h2", null, b.text); },
    quote: function (b) {
      var q = el("blockquote", "pull");
      q.appendChild(el("p", null, "「" + b.text + "」"));
      if (b.cite) q.appendChild(el("cite", null, "—— " + b.cite));
      return q;
    },
    expert: function (b) {
      var box = el("aside", "expert");
      box.appendChild(el("div", "expert__avatar", initialsOf(b.name)));
      var body = el("div");
      body.appendChild(el("p", "expert__name", b.name));
      body.appendChild(el("p", "expert__affil", b.affil || ""));
      var t = el("p", "expert__text");
      t.appendChild(rich("「" + b.text + "」"));
      body.appendChild(t);
      box.appendChild(body);
      return box;
    },
    figure: function (b) {
      var fig = el("figure", "unrelated");
      var ph = el("div", "ph");
      ph.appendChild(el("span", null, "NO IMAGE AVAILABLE"));
      fig.appendChild(ph);
      fig.appendChild(el("figcaption", null, b.caption));
      return fig;
    },
    stat: function (b) {
      var s = el("div", "stat");
      s.appendChild(el("p", "stat__value", b.value));
      s.appendChild(el("p", "stat__label", b.label));
      if (b.note) s.appendChild(el("p", "stat__note", b.note));
      return s;
    }
  };

  /* 記者・寄稿者はサイト設定に定義されたイニシャルを使う。
     未登録の人物だけ、名前から機械的に組み立てる。 */
  function initialsOf(name) {
    var staff = SITE.staff || [];
    for (var i = 0; i < staff.length; i++) {
      if (staff[i].name === name && staff[i].initials) return staff[i].initials;
    }
    var m = String(name).match(/[A-Za-z]/g);
    if (m && m.length >= 2) return (m[0] + m[1]).toUpperCase();
    return String(name).slice(0, 2);
  }

  function renderArticle() {
    var host = document.getElementById("main");
    if (!host) return;

    var id = new URLSearchParams(window.location.search).get("id");
    var a = id ? byId(id) : ARTICLES[0];

    if (!a) {
      document.title = "記事が見つかりません — " + SITE.nameEn;
      var nf = el("div", "notfound");
      nf.appendChild(el("h1", null, "404"));
      nf.appendChild(el("p", null, "お探しの記事は存在しません。本紙の記者が、まだ誤読していない可能性があります。"));
      nf.appendChild(link("index.html", "→ 一面に戻る"));
      host.appendChild(nf);
      return;
    }

    document.title = a.headline + " — " + SITE.nameJa + " " + SITE.editionJa;

    var art = el("article", "article");
    art.appendChild(el("span", "kicker", a.kicker));
    art.appendChild(el("h1", "article__headline", a.headline));
    art.appendChild(el("p", "article__sub", a.subhead));

    var by = el("div", "byline");
    by.appendChild(el("span", "byline__name", a.byline));
    by.appendChild(el("span", "byline__note", a.bylineNote));
    by.appendChild(el("span", "byline__date", a.dateline));
    art.appendChild(by);

    art.appendChild(el("p", "article__lead", a.lead));

    var src = el("div", "source-note");
    src.appendChild(el("b", null, "元ネタ（実在の事象）"));
    src.appendChild(document.createTextNode(a.source));
    art.appendChild(src);

    art.appendChild(el("p", "lens-note", "考察の型：" + a.lens));

    var body = el("div", "article__body");
    (a.body || []).forEach(function (b) {
      var make = BLOCKS[b.type];
      if (make) body.appendChild(make(b));
    });
    art.appendChild(body);

    var note = el("div", "editor-note");
    note.appendChild(el("b", null, "編集部注"));
    note.appendChild(document.createTextNode(a.editorNote));
    art.appendChild(note);

    art.appendChild(tagList(a.tags));
    host.appendChild(art);

    /* 読者コメント（翻訳付き） */
    var cs = el("section", "comments");
    cs.appendChild(el("h2", "section-title", "読者コメント（本紙による翻訳）"));
    (a.comments || []).forEach(function (c) {
      var box = el("div", "comment");
      var head = el("div", "comment__head");
      head.appendChild(el("span", "comment__user", c.user));
      head.appendChild(el("span", "comment__country", c.country));
      head.appendChild(el("span", "comment__likes", "▲ " + c.likes.toLocaleString("ja-JP")));
      box.appendChild(head);
      box.appendChild(el("p", "comment__text", c.text));
      cs.appendChild(box);
    });
    host.appendChild(cs);

    /* 次の記事へ */
    var idx = ARTICLES.indexOf(a);
    var next = ARTICLES[(idx + 1) % ARTICLES.length];
    var more = el("section", "comments");
    more.appendChild(el("h2", "section-title", "次の誤読"));
    var h = el("h3", "card__headline");
    h.appendChild(link("article.html?id=" + encodeURIComponent(next.id), next.headline));
    more.appendChild(h);
    more.appendChild(el("p", "card__sub", next.subhead));
    host.appendChild(more);
  }

  /* ---------- 本紙について ---------- */
  function renderAbout() {
    var host = document.getElementById("staff");
    if (!host) return;
    (SITE.staff || []).forEach(function (s) {
      var li = el("li");
      li.appendChild(el("div", "expert__avatar", s.initials));
      var d = el("div");
      d.appendChild(el("p", "staff__name", s.name));
      d.appendChild(el("p", "staff__role", s.role));
      d.appendChild(el("p", "staff__bio", s.bio));
      li.appendChild(d);
      host.appendChild(li);
    });

    var spec = document.getElementById("spec");
    if (spec) {
      [["紙名", SITE.nameEn + "／" + SITE.nameJa],
       ["創刊", SITE.founded],
       ["発行部数", SITE.circulation],
       ["モットー", SITE.mottoEn + "（" + SITE.mottoJa + "）"],
       ["編集方針", SITE.policy]].forEach(function (row) {
        var tr = el("tr");
        tr.appendChild(el("th", null, row[0]));
        tr.appendChild(el("td", null, row[1]));
        spec.appendChild(tr);
      });
    }
  }

  /* ---------- 起動 ---------- */
  function boot() {
    var page = document.body.getAttribute("data-page");
    renderChrome(page);
    if (page === "index") renderIndex();
    else if (page === "article") renderArticle();
    else if (page === "about") renderAbout();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
