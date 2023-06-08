# HtmlTableParser

`HtmlTableParser` is a Node.js library that allows parsing HTML tables into JavaScript objects.

## Installation

To install `HtmlTableParser`, simply run:

```bash
npm install html-table-parser-node --save
```

## Usage

To use `HtmlTableParser`, require the library and create a new instance with the HTML content to be parsed:

```javascript
const HtmlTableParser = require('html-table-parser-node');

const html = '<table>...</table>'; // HTML content containing tables to be parsed
const parser = new HtmlTableParser(html);
```

You can also provide optional configuration options to the constructor:

```javascript
const parser = new HtmlTableParser(html, {
    trim_keys: false, // Whether to trim the keys of table headers
    lowercase_keys: false, // Whether to convert the keys of table headers to lowercase
    remove_double_whitespaces: false, // Whether to remove double whitespaces from the keys of table headers
    replace_whitespaces_keys: '-', // Whether to replace whitespaces in the keys of table headers
});
```

Once you have created a parser, you can use its public methods to parse the tables:

```javascript
// Parse all tables on the current page
const tables = parser.parseAllTables();

// Parse a table based on a selector
const table = parser.parseTable('#my-table');
```

Both methods return an array of JavaScript objects, where each object represents a row in the table. The keys of the object correspond to the header of each column.

## License

`HtmlTableParser` is licensed under the MIT license. See the [LICENSE](LICENSE) file for more details.