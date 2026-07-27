# Yard Sale Website

A simple static catalogue for a personal yard sale, hosted on GitHub Pages.

## Updating the catalogue

Edit `items.json`. Each item follows this format:

```json
{
  "id": "unique-item-name",
  "title": "Item name",
  "price": 100,
  "category": "Furniture",
  "condition": "Very good",
  "status": "available",
  "summary": "Short description shown on the card.",
  "description": "Longer description shown when the item is opened.",
  "image": "images/photo-name.jpg",
  "images": [
    "images/photo-name.jpg",
    "images/photo-name-2.jpg",
    "images/photo-name-3.jpg"
  ],
  "collection": "Welling, London"
}
```

Valid statuses are:

- `available`
- `reserved`
- `sold`


## Adding several photos to one item

The first `image` is used on the catalogue card. The `images` list is used inside the item popup:

```json
"image": "images/chair-front.jpg",
"images": [
  "images/chair-front.jpg",
  "images/chair-side.jpg",
  "images/chair-detail.jpg"
]
```

Visitors can use the arrows, photo dots, keyboard arrow keys, or swipe on a phone.

## Adding photos

Put images inside the `images` folder and make sure the filename matches the value used in `items.json`.

## WhatsApp number

Open `script.js` and update:

```js
const WHATSAPP_NUMBER = "";
```

Use the full international number without `+` or spaces. Example:

```js
const WHATSAPP_NUMBER = "447700900000";
```

## Publishing updates

```bash
git add .
git commit -m "Update yard sale catalogue"
git push
```
