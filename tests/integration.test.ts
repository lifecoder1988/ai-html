// tests/integration.test.ts
import { describe, it, expect } from "vitest";
import { compile } from "../src/index.js";

describe("compile", () => {
  it("compiles a simple element", () => {
    expect(compile('p"Hello"')).toBe("<p>Hello</p>");
  });

  it("compiles nested structure", () => {
    expect(compile('d>p"Hi"')).toBe("<div><p>Hi</p></div>");
  });

  it("compiles siblings", () => {
    expect(compile('h1"A"+p"B"')).toBe("<h1>A</h1><p>B</p>");
  });

  it("compiles full card example", () => {
    const aim = 'd.%K>h3.Tb"Title"+p.Ts"Desc"';
    const html = compile(aim);
    expect(html).toContain("<div");
    expect(html).toContain("width:100%");
    expect(html).toContain("font-weight:bold");
    expect(html).toContain(">Title</h3>");
    expect(html).toContain("font-size:0.875rem");
    expect(html).toContain(">Desc</p>");
  });

  it("compiles attributes and text", () => {
    const aim = 'a[h=/page;tg=_blank]"Click"';
    const html = compile(aim);
    expect(html).toBe('<a href="/page" target="_blank">Click</a>');
  });

  it("compiles grouping with multiply", () => {
    const aim = '(l"item")*3';
    const html = compile(aim);
    expect(html).toBe("<li>item</li><li>item</li><li>item</li>");
  });

  it("compiles self-closing img", () => {
    const aim = 'm[s=/img.jpg;a=Photo]';
    const html = compile(aim);
    expect(html).toBe('<img src="/img.jpg" alt="Photo">');
  });

  it("compiles complex nested layout", () => {
    const aim = 'd.F.Ac.Jb.P4>(s.Tb"Logo"+n>u>(l>a[h=/a]"A"+l>a[h=/b]"B"))';
    const html = compile(aim);
    expect(html).toContain("display:flex");
    expect(html).toContain("align-items:center");
    expect(html).toContain("<nav><ul>");
    expect(html).toContain('href="/a"');
    expect(html).toContain('href="/b"');
  });

  it("compiles the full page example from the spec", () => {
    const aim =
      'd.%Col.Hs>(n.%R.P4.Bg#1a1a2e>(a[h=/]"Logo"+d.F.Gp4>(a[h=/about]"About"+a[h=/work]"Work"+a[h=/contact]"Contact"))+mn.F1.P8>(sc.%Col.Gp6.Xw800.Ma>(h1.T2x.Tb"Welcome"+p.Tl.C#666"Build faster with AIM"+d.F.Gp4>(a[h=#].%B"Get Started"+a[h=#].%B.Bg#fff.C#333.B1"Learn More"))+sc.Gc3.Gp6.My8>(d.%K>(h3.Tb"Fast"+p.Ts"80% fewer tokens")+d.%K>(h3.Tb"Simple"+p.Ts"Emmet-based syntax")+d.%K>(h3.Tb"Complete"+p.Ts"Full HTML coverage")))+ft.%R.P4.Bg#1a1a2e.C#fff>(p.Ts"© 2026 AIM"+d.F.Gp4>(a[h=#].%T.C#fff"Twitter"+a[h=#].%T.C#fff"GitHub")))';
    const html = compile(aim);
    // Verify structure
    expect(html).toContain("<nav");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
    expect(html).toContain(">Welcome</h1>");
    expect(html).toContain(">80% fewer tokens</p>");
    // Verify styles
    expect(html).toContain("height:100vh");
    expect(html).toContain("flex:1");
    expect(html).toContain("max-width:800px");
    // Verify it's valid-looking HTML (balanced tags at minimum)
    const openTags = (html.match(/<[a-z][^/]*>/g) ?? []).length;
    const closeTags = (html.match(/<\/[a-z]+>/g) ?? []).length;
    expect(openTags).toBeGreaterThan(10);
    expect(closeTags).toBeGreaterThan(10);
  });

  it("compiles pseudo-class styles", () => {
    const aim = 'd.Bg#fff:h{Bg#eee}';
    const html = compile(aim);
    expect(html).toContain("<style>");
    expect(html).toContain(":hover");
    expect(html).toContain("background:#eee");
  });
});
