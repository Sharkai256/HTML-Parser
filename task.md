Документация по TypeScript - https://www.typescriptlang.org/docs/handbook/2/basic-types.html
Пример кода на TypeScript - https://github.com/UROBBYU/http-php

ТЗ по парсингу - https://docs.google.com/document/d/1eyUVzZmNZIvDa0nel40NANRBDbxyzTMmAe3VAK8xkW0/view?usp=sharing

ТЗ по сериализации - https://docs.google.com/document/d/1hSObDjnY4f0iQiKVjIce4oj_GIcbFAgddxL8It9Fk6w/view?usp=sharing

```TS
class Node {
    ✔️ nodeType: number // 1 - element, 2 - attribute, 3 - text, 4 - cdata, 7 - processing instruction, 8 - comment, 9 - document, 10 - doctype
    ✔️ nodeName: string // Имя тега, '#text' для текстовых нод, '#document' для рута документа, '#comment' для комментариев и '#doctype' для !DOCTYPE.
    ✔️ nodeValue: string | null // Содержимое текстовой ноды, либо null.
    textContent: string // Содержимое дочерних нод в виде текста.
    ✔️ childNodes: Node[] // Массив прямых дочерних нод.
    parentNode: Node // Родительская нода.
    parentElement: Element // Родительский элемент.

    ✔️ toString: () => string // Сериализует ноду.
}

class Element extends Node {
    ✔️ tagName: string // Имя тега в высшем регистре. Пример: HEAD
    ✔️ children: Element[] // Массив прямых дочерних элементов.
    innerText: string // Алиас на textContent.
    innerHTML: string // Всё что находится внутри тега. При считывании сериализует все дочерние элементы. При присвоении парсит ввод.
    ✔️ attributes: AttributeMap // Аттрибуты элемента.
    
    querySelectorAll: (selector: string) => Element[] // Находит среди всех дочерних элементов те, которые подходят по селектору.
    querySelector: (selector: string) => Element // Находит первый дочерний элемент который подходит по селектору.
    getElementById: (id: string) => Element // Находит первый дочерний элемент с указанным id.
    ✔️ appendChild: (element: Element) => void // Добавляет новый дочерний элемент. { this.children.push(element) }.
    ✔️append: (node: Element | string) => void // Если node является объектом типа Element, то выполняет appendChild. Если нет - сериализует и добавляет как текстовую ноду.
}

class SimpleDOM extends Element {
    ✔️ createElement: (tagName: string) => Element // Создает объект типа Element с указанным именем тега.
    createFullElement: (html: string) => Element // Парсит ввод и создает из него Element.
}
```
