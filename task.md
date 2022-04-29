Документация по TypeScript - https://www.typescriptlang.org/docs/handbook/2/basic-types.html
Пример кода на TypeScript - https://github.com/UROBBYU/http-php

ТЗ по парсингу - https://docs.google.com/document/d/1eyUVzZmNZIvDa0nel40NANRBDbxyzTMmAe3VAK8xkW0/view?usp=sharing

ТЗ по сериализации - https://docs.google.com/document/d/1hSObDjnY4f0iQiKVjIce4oj_GIcbFAgddxL8It9Fk6w/view?usp=sharing

```TS
🚧 function fromJSON(json: string | object): DOM // Парсит JSON и собирает из него DOM.

class Node {
    ✔️ get nodeType: number // 1 - element, 2 - attribute, 3 - text, 4 - cdata, 7 - processing instruction, 8 - comment, 9 - document, 10 - doctype
    ✔️ get nodeName: string // Имя тега, '#text' для текстовых нод, '#document' для рута документа, '#comment' для комментариев и '#doctype' для !DOCTYPE.
    ✔️ get nodeValue: string | null // Содержимое текстовой ноды, либо null.
    ✔️ get | set textContent: string // Содержимое дочерних текстовых нод. При присвоении заменяет все дочерние ноды на текстовую с заданным значением.
    ✔️ get childNodes: Node[] // Массив прямых дочерних нод.
    ✔️ get parentNode: Node | null // Родительская нода.
    ✔️ get parentElement: Element | null // Родительский элемент. Фильтровать ноду.

    ✔️ toString: () => string // Сериализует ноду.
    ✔️ appendChild: (element: Node) => void // Добавляет новый дочерний элемент. Работает только с Element, для остальных классов выбрасывает ошибку.
    ✔️ remove: () => void // Убирает ноду из дерева. Очищает parentNode. Удаляет ноду из childNodes у родительской ноды.
    🚧 toJSON: () => string // Сериализует ноду в JSON формате.
}

class Element extends Node {
    ✔️ get tagName: string // Имя тега в верхнем регистре. Пример: HEAD
    ✔️ get children: Element[] // Массив прямых дочерних элементов.
    ✔️ get | set innerText: string // Алиас на textContent.
    ✔️ get | set innerHTML: string // Всё что находится внутри тега. При считывании сериализует все дочерние элементы. При присвоении парсит ввод.
    ✔️ get attributes: AttributeMap // Аттрибуты элемента.
    ✔️ get | set id: string // Аттрибут id.
    🚧 get classList: TokenList // Аттрибут class.
    🚧 get style: StringMap // Аттрибут style.
    🚧 get dataset: StringMap // Аттрибуты data-*.

    ✔️ append: (node: Node | string) => void // Если node является объектом типа Element, то выполняет appendChild. Если нет - сериализует и добавляет как текстовую ноду.
    🚧 querySelectorAll: (selector: string) => Element[] // Находит среди всех дочерних элементов те, которые подходят по селектору.
    🚧 querySelector: (selector: string) => Element // Находит первый дочерний элемент который подходит по селектору.
    🚧 getElementById: (id: string) => Element // Находит первый дочерний элемент с указанным id.
}

class DOM extends Element {
    ✔️ createElement: (tagName: string) => Element // Создает объект типа Element с указанным именем тега.
    ✔️ createNode: (html: string) => Node // Парсит ввод и создает из него ноду. Возвращает только первую ноду созданную парсером.
}

class SingleTag extends Element {
    ✔️ get endClosed: boolean // Указывает сериализатору добавлять '/' в конец тега.
}

class TokenList extends Set<string> {
    ✔️ get | set value: string // Токены разделённые пробелом. При присвоении разбивает строку по пробелам.
    ✔️ replace: (oldToken: string, newToken: string) => boolean // Заменяет существующий токен новым. Возвращает true если операция успешна.
    ✔️ toggle: (token: string, force?: boolean) => boolean // Удаляет токен из списка и возвращает false. Если токена не существует - добавляет и возвращает true.
    🚧 // Написать хуки на add, delete и clear.
}

class StringMap implements Map<string, string> {
    🚧 private _map: Map<string, string>() // Хранит пары ключ-значение.
    🚧 constructor: (callback: (([string, string])[]) => void) => new Proxy(/* ... */) // Прокси должен перехватывать ивенты get, set, ownKeys и подставлять на их место пары из _map.
    🚧 // Все методы требуемые для имплементации Map<string, string> - алиасы на одноимённые методы в _map.
    🚧 get [Symbol.iterator]: () => this.entries()
    🚧 get [Symbol.toStringTag]: 'StringMap'
    🚧 // Написать хуки на set, delete и clear. При передаче пар в колбек, перевести ключи из камел-кейса в кебеб-кейс.
}
```