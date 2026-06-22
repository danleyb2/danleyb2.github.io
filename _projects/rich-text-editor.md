---
layout: project

title: Rich Text Editor
date: 2020-02-10
description: Rich Text Editor

tags:
  - JavaScript
  - WebComponents
  
status: Active

github: https://github.com/danleyb2/rich-text-editor

technologies:
  - JavaScript
  - WebComponents
  - Frontend
  
---

![Node.js Package](https://github.com/danleyb2/rich-text-editor/workflows/Node.js%20Package/badge.svg)

A Rich Text Editor Web Component 

## Features
- Tiny


## Usage

1. load module
    ```html
    <!-- Bottom of body -->
    <script type="module" src="https://unpkg.com/@danleyb2/rich-text-editor@0.0.3/dist/es6-unbundled/index.js"></script>
    ```
2. use component
    ```html
    
    <rich-text-editor></rich-text-editor>
    
    ```

3. get value
    ```js
    let v = document.querySelector('rich-text-editor').value;
    console.log(v);
    ```

