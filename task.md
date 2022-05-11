Документация по TypeScript - https://www.typescriptlang.org/docs/handbook/2/basic-types.html
Пример кода на TypeScript - https://github.com/UROBBYU/http-php

ТЗ по парсингу - https://docs.google.com/document/d/1eyUVzZmNZIvDa0nel40NANRBDbxyzTMmAe3VAK8xkW0/view?usp=sharing

ТЗ по сериализации - https://docs.google.com/document/d/1hSObDjnY4f0iQiKVjIce4oj_GIcbFAgddxL8It9Fk6w/view?usp=sharing

```TS
🚧 // Нужно сделать
⚠️ // Нужно починить
⛔ // Нужно починить срочно
✔️ // Готово

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
    ✔️ removeChild: (node: Node) => Node // Удаляет указанную ноду из текущей. Если нода не указана или не являеться дочерней к текущей - выбрасывает ошибку. Возвращает удалённую ноду.
    🚧 cloneNode: (deep: boolean = true) => Node // Клонирует ноду. Возвращает клон. Если deep == true, клонирует также все дочерние ноды.
    ✔️ insertBefore: (newNode: Node, referenceNode: Node) // Вставляет ноду перед указанной.
    ✔️ replaceChild: (newChild: Node, oldChild: Node) // Заменяет одну дочернюю ноду другой. Выбрасывает ошибку если замена невозможна.
    ✔️ contains: (node: Node) => boolean // Проверяет, является ли указанная нода дочерней к текущей.
    🚧 toJSON: () => string // Сериализует ноду в JSON формате.
}

class Element extends Node {
    ✔️ get tagName: string // Имя тега в верхнем регистре. Пример: HEAD
    ✔️ get children: Element[] // Массив прямых дочерних элементов.
    ✔️ get | set innerText: string // Алиас на textContent.
    ✔️ get | set innerHTML: string // Всё что находится внутри тега. При считывании сериализует все дочерние элементы. При присвоении парсит ввод.
    ✔️ get attributes: AttributeMap // Аттрибуты элемента.
    ✔️ get | set id: string // Аттрибут id.
    ✔️ get classList: TokenList // Аттрибут class.
    ✔️ get | set className: string // Алиас на Element.classList.value.
    ✔️ get style: StringMap // Аттрибут style.
    ✔️ get dataset: StringMap // Аттрибуты data-*.

    ✔️ append: (...node: (Node | string)[]) => void // Если node является объектом типа Element, то выполняет appendChild. Если нет - сериализует и добавляет как текстовую ноду.
    ✔️ prepend: (...node: (Node | string)[]) => void // Делает то же самое что и append, только ноды добавляются в начало списка.
    ✔️ before: (...node: (Node | string)[]) => void // Добавляет список нод в родительский элемент прямо перед текущим элементом. Если родительский элемент не существует, выдает ошибку.
    ✔️ after: (...node: (Node | string)[]) => void // before только добавляет ноды после текущего элемента.
    ✔️ replaceWith: (...node: (Node | string)[]) => void // Заменяет такущий элемент в списке дочерних элементов родителя на указанные ноды. Выбрасывает ошибку если замена невозможна.
    ✔️ setAttribute: (name: string, value: string) => void // Устанавливает аттрибут с указанными именем и значением.
    ✔️ getAttribute: (name: string) => string // Возвращает значение аттрибута с указанным именем. Если аттрибута с таким именем не существует, возвращает null.
    ✔️ removeAttribute: (name: string) => void // Удаляет аттрибут с указанным именем.
    ✔️ toggleAttribute: (name: string, force?: boolean) => void // Добавляет или удаляет аттрибут с указанным именем.
    ✔️ hasAttribute: (name: string) => boolean // Проверяет существует ли аттрибут с указанным именем.
    🚧 querySelectorAll: (selector: string) => Element[] // Находит среди всех дочерних элементов те, которые подходят по селектору.
    🚧 querySelector: (selector: string) => Element // Находит первый дочерний элемент который подходит по селектору.
    🚧 getElementById: (id: string) => Element // Находит первый дочерний элемент с указанным id. Регистр не важен.
    🚧 getElementsByTagName: (name: string) => Element // Находит все элементы с указанным названием тега. Регистр не важен.
    🚧 getElementsByName: (name: string) => Element // Находит всу элементы с указанным аттрибутом name.
    🚧 getElementsByClassName: (names: string) => Element // Находит все элементы с указанным className.
}

class DOM extends Element {
    🚧 get | set title: string // Текстовое значение тега <title>. При присвоении, если тег отсутствует - создать.
    🚧 get head: Element | null // Возвращает первый найденный тег <head> в <html>.
    🚧 get body: Element | null // Возвращает первый найденный тег <body> в <html>.
    ✔️ get doctype: DocumentType | null // Возвращает первый найденный тег <!DOCTYPE> среди подчинённых DOM.
    ✔️ get documentElement: Element | null // Возвращает тег <html> если он есть.

    ✔️ createElement: (tagName: string) => Element // Создает объект типа Element с указанным именем тега.
    ✔️ createNode: (html: string) => Node // Парсит ввод и создает из него ноду. Возвращает только первую ноду созданную парсером.
    🚧 createScript: (code: string, defer?: boolean, async?: boolean) => Element // Возвращает тег <script> с дочерней текстовой нодой содержащей код из code. Также имеет опциональные аттрибуты defer и async.
    🚧 createScript: (options: { code: string, defer?: boolean, async?: boolean }) => Element // Перегрузка для предыдущего метода.
}

class SingleTag extends Element {
    ✔️ get endClosed: boolean // Указывает сериализатору добавлять '/' в конец тега.
}

class TokenList extends Set<string> {
    ✔️ get | set value: string // Токены разделённые пробелом. При присвоении разбивает строку по пробелам.

    ✔️ replace: (oldToken: string, newToken: string) => boolean // Заменяет существующий токен новым. Возвращает true если операция успешна.
    ✔️ toggle: (token: string, force?: boolean) => boolean // Удаляет токен из списка и возвращает false. Если токена не существует - добавляет и возвращает true.

    ✔️ // Написать хуки на add, delete и clear.
}

class StringMap implements Map<string, string> {
    ✔️ private _map: Map<string, string>() // Хранит пары ключ-значение.

    ✔️ constructor: (callback: (([string, string])[]) => void) => new Proxy(/* ... */) // Прокси должен перехватывать ивенты get, set, ownKeys и подставлять на их место пары из _map.

    ✔️ get [Symbol.iterator]: () => this.entries()
    ✔️ get [Symbol.toStringTag]: 'StringMap'

    ✔️ // Все методы требуемые для имплементации Map<string, string> - алиасы на одноимённые методы в _map.
    ✔️ // Написать хуки на set, delete и clear. При передаче пар в колбек, перевести ключи из камел-кейса в кебеб-кейс.
}

class AttributeMap {
    🚧 // Предусмотреть обратную связь с classList, style и dataset.
}
```