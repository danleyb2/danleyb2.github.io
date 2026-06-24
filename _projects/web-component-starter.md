---
layout: project

title: Web Component Starter
date: 2020-02-08
description: A starter template for Web Component projects.

tags:
  - WebComponents
  - Js
  
status: Active

github: https://github.com/danleyb2/web-component

technologies:
  - WebComponents
  - Js
  - Frontend

is_highlighted: true

---

A starter project for building re-usable web components using `lit-element `

## Features
- LitElement for a declarative UI, automatic updates when properties change.
- Follows Web Components standards, works with any framework
- Building with bundling and transpilation using polymer build 
- Testing with [Web-Component-Tester](/projects/web-component-tester.md)

## Usage

Load module
```html
<!-- Bottom of body -->
<script type="module" src="https://unpkg.com/@danleyb2/web-component"></script>
```

Use custom component
```html

<web-component></web-component>

```

