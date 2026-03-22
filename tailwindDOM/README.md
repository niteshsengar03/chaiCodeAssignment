# ☕ Chai UI – Runtime Utility CSS Engine

A mini Tailwind-like CSS engine built using vanilla JavaScript that parses custom class names and applies styles dynamically at runtime.

## 🔗 Links

* 🎥 [YouTube Video](https://t.co/Qqmi3NYav8)
* 🐦 [X (Twitter) Thread](https://x.com/NiteshSengar15/status/2035736881426841915)
* 🌐 [Live Demo](https://cool-speculoos-c5457c.netlify.app/)
* 💻 [GitHub Repository](https://github.com/niteshsengar03/chaiCodeAssignment/tree/main/tailwindDOM)

---

## 🚀 What is this?

Instead of writing custom CSS, you write utility classes directly in your HTML, such as:

* `chai-p-12`
* `chai-bg-red500`
* `chai-d-flex`

Our vanilla JavaScript engine runs in the browser, scans the DOM, parses these specific utility classes, converts them into real CSS properties, and applies the styles dynamically at runtime!

---

## ⚙️ How it Works (The Pipeline)

1.  **Select Elements:** Scans the DOM for all elements with a class.
    ```javascript
    document.querySelectorAll('[class]')
    ```
2.  **Iterate Elements:** Loops through each element and reads its `classList`.
3.  **Filter:** Only processes classes starting with the prefix `chai-`.
4.  **Parse:** Splits the class string into usable parts.
    * *Example:* `chai-p-12` → `["chai", "p", "12"]`
5.  **Extract:** Identifies the utility and the value.
    * `utility = "p"`
    * `value = "12"`
6.  **Map Lookup:** Maps the short utility to a real CSS property (e.g., `p` → `padding`).
7.  **Process Value:** Formats the value appropriately:
    * *Spacing* → Appends `px`
    * *Color* → Looks up palette, hex, or fallback
    * *Keyword* → Applies directly
8.  **Apply Style:** Injects the inline style onto the element.
    ```javascript
    element.style[property] = finalValue
    ```

---

## 🧑‍💻 How to Use

### 1. Write HTML
Add the `chai-*` utility classes to your elements:
```html
<h1 class="chai-p-12 chai-bg-blue500 chai-text-white">
  Hello World
</h1>
