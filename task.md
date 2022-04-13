Документация по TypeScript - https://www.typescriptlang.org/docs/handbook/2/basic-types.html
Пример кода на TypeScript - https://github.com/UROBBYU/http-php

ТЗ по парсингу - https://docs.google.com/document/d/1eyUVzZmNZIvDa0nel40NANRBDbxyzTMmAe3VAK8xkW0/view?usp=sharing

ТЗ по сериализации - https://docs.google.com/document/d/1hSObDjnY4f0iQiKVjIce4oj_GIcbFAgddxL8It9Fk6w/view?usp=sharing

```TS
class Node {
    nodeName: string // Имя тега, '#text' для текстовых нод, '#comment' для комментариев и '#doctype' для !DOCTYPE.
    nodeValue: string | null // Содержимое текстовой ноды, либо null.
    textContent: string // Содержимое дочерних нод в виде текста.
    childNodes: Node[] // Массив прямых дочерних нод.
    parentNode: Node // Родительская нода.
    parentElement: Element // Родительский элемент.

    get [Symbol.toPrimitive]: () => () => string // Возвращает textContent. Что это значит - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive
    get [Symbol.toStringTag]: () => 'Node' // Возвращает 'Node'. Зачем - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag
}

class Element extends Node {
    tagName: string // Имя тега в высшем регистре. Пример: HEAD
    children: Element[] // Массив прямых дочерних элементов.
    innerText: string // Алиас на textContent.
    innerHTML: string // Всё что находится внутри тега. При считывании сериализует все дочерние элементы. При присвоении парсит ввод.
    
    toString: () => string // Сериализует элемент.
    querySelectorAll: (selector: string) => Element[] // Находит среди всех дочерних элементов те, которые подходят по селектору.
    querySelector: (selector: string) => Element // Находит первый дочерний элемент который подходит по селектору.
    getElementById: (id: string) => Element // Находит первый дочерний элемент с указанным id.
    appendChild: (element: Element) => void // Добавляет новый дочерний элемент. { this.children.push(element) }.
    append: (node: any) => void // Если node является объектом типа Element, то выполняет appendChild. Если нет - сериализует и добавляет как текстовую ноду.

    get [Symbol.toStringTag]: () => 'Element' // Возвращает 'Element'.
}

class SimpleDOM extends Element {
    createElement: (tagName: string) => Element // Создает объект типа Element с указанным именем тега.
    createFullElement: (html: string) => Element // Парсит ввод и создает из него Element.

    get [Symbol.toStringTag]: () => 'SimpleDOM' // Возвращает 'SimpleDOM'.
}
```