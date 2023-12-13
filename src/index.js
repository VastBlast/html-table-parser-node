const cheerio = require('cheerio');


class HtmlTableParser {
    /**
     * Represents an HTML table parser.
     * @constructor
     * @param {string} html - The HTML content containing the tables to be parsed.
     * @param {Object} [opts={}] - Optional configuration options.
     * @param {boolean} [opts.trim_keys=true] - Whether to trim the keys of table headers.
     * @param {boolean} [opts.lowercase_keys=true] - Whether to convert the keys of table headers to lowercase.
     * @param {boolean} [opts.remove_double_whitespaces=true] - Whether to remove double whitespaces from the keys of table headers.
     * @param {boolean|string} [opts.replace_whitespaces_keys=true] - Whether to replace whitespaces in the keys of table headers.
     *    If set to `true`, the whitespaces will be replaced with underscores. If set to a string, the whitespaces will be replaced with the specified string.
     */
    constructor(html, opts = {}) {
        const {
            trim_keys = true,
            lowercase_keys = true,
            remove_double_whitespaces = true,
            replace_whitespaces_keys = true
        } = opts;

        this.opts = {
            trim_keys,
            lowercase_keys,
            remove_double_whitespaces,
            replace_whitespaces_keys
        }

        this.$ = cheerio.load(html);
    }

    // Private method that extracts the headers of a table and applies the configuration options to them.
    _getHeaders(table) {
        const $ = this.$;
        const headers = [];
        const $table = $(table);
        let headerRows = $table.find('thead').find('tr');
        if (!headerRows.length) headerRows = $table.find('tr').slice(0, 1);
        for (const tr of headerRows) {
            const ths = [];
            for (const th of $(tr).find('th')) {
                let name = $(th).text();
                if (this.opts.trim_keys) name = name.trim();
                if (this.opts.lowercase_keys) name = name.toLowerCase();
                if (this.opts.remove_double_whitespaces) name = name.replace(/\s\s+/g, ' ');
                if (this.opts.replace_whitespaces_keys) name = name.replace(/\s/g, this.opts.replace_whitespaces_keys === true ? '_' : this.opts.replace_whitespaces_keys);

                ths.push({
                    name: name,
                    remainingSubheaders: parseInt($(th).attr('colspan')) || 0,
                    subheaders: []
                })
            }

            headers.push(ths);
        }

        // reverse
        for (let i = headers.length - 1; i >= 0; i--) {
            if (i == 0) continue;
            const headerGroup = headers[i];
            const parentHeaderGroup = headers[i - 1];

            // add to parent if it can then delete it from the group
            for (let j = 0; j < headerGroup.length; j++) {
                const header = headerGroup[j];
                for (let k = 0; k < parentHeaderGroup.length; k++) {
                    const parentHeader = parentHeaderGroup[k];
                    if (!parentHeader.remainingSubheaders) continue;
                    parentHeader.remainingSubheaders -= header.subheaders.length || 1;
                    parentHeader.subheaders.push(header);
                    delete headerGroup[j];
                    break;
                }
            }
        }

        const combinedHeaders = [];
        for (const headerGroup of headers) {
            for (const header of headerGroup) {
                if (!header) continue;
                combinedHeaders.push(header);
            }
        }

        return combinedHeaders;
    }

    // Private method that extracts the rows of a table.
    _getRows(table) {
        const $ = this.$;
        const rows = [];
        for (const tr of $(table).find('tbody').find('tr')) {
            const tds = [];
            for (const td of $(tr).find('td, th')) {
                tds.push($(td).text().trim())
            }

            rows.push(tds);
        }

        return rows;
    }

    // Private method that maps a row to its corresponding headers.
    _mapRowToHeaders(combinedHeaders, row) {
        const mappedRow = {};
        function mapHeaders(headers, fullHeaders) {
            for (const header of headers) {
                if (header.subheaders.length > 0) {
                    for (let i = 0; fullHeaders[header.name]; i++) header.name += `_${i++}`;
                    fullHeaders[header.name] = {};
                    mapHeaders(header.subheaders, fullHeaders[header.name]);
                } else {
                    fullHeaders[header.name] = row.shift();
                }
            }
        }
        mapHeaders(combinedHeaders, mappedRow);

        for (let i = 0; i < row.length; i++) {
            mappedRow[`unlabelled_${i}`] = row[i];
        }

        return mappedRow;
    }

    // Private method that maps all rows of a table to their corresponding headers.
    _mapRowsToHeaders(headers, rows) {
        const mappedRows = [];
        for (const row of rows) {
            mappedRows.push(this._mapRowToHeaders(headers, row));
        }

        return mappedRows;
    }

    // Private method that combines `_getHeaders` and `_getRows` to parse a table.
    _parseTable(table) {
        return this._mapRowsToHeaders(this._getHeaders(table), this._getRows(table));
    }

    /**
     * Parses all tables on the current page.
     *
     * @returns {Array} An array of parsed tables.
     */
    parseAllTables() {
        const $ = this.$;
        const tables = $('table');
        const parsedTables = [];

        tables.each((index, table) => {
            parsedTables.push(this._parseTable(table));
        });

        return parsedTables;
    }

    /**
     * Parses a table based on the provided selector.
     *
     * @param {string} selector - The selector to identify the table.
     * @returns {Object} The parsed table.
     */
    parseTable(selector) {
        const $ = this.$;
        const table = $(selector);
        return this._parseTable(table);
    }
}


module.exports = HtmlTableParser;