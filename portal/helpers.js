'use strict';

let Handlebars = require('handlebars');
let slug = require('slug');
let marked = require('marked');

/**
 * Slugifies strings, removing spaces and non-url-compatible characters, and
 * replacing them with hyphens. Also lower-cases everything. Basically creates
 * a URL 'slug'. Gracefully degrades: if you pass it a bad value, it will simply
 * return an empty string. If you pass multiple arguments, the strings will be
 * combined into a single long slug.
 * @param {string...} arguments input strings you want to slugify
 * @returns {string} Processed string, with invalid characters replaced by
 * hyphens
 */
module.exports.slug = function() {
  let args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
  try {
    return slug(args.join(' '), {mode: 'rfc3986'});
  } catch (e) {
    return '';
  }
};

/**
 * Parse a markdown string into resulting HTML markup.
 * @param {string} markdownString A string containing markdown syntax text
 * @returns {Handlebars.SafeString} Non-escaping HTML for rendering in-page.
 * This will be safe because the Markdown parser generates good HTML.
 */
module.exports.markdown = function(markdownString) {
  return new Handlebars.SafeString(marked(markdownString));
};

/**
 * Returns the language component of a standard content type string.
 * @param {string} contentType content type string such as
 * 'application/javascript'
 * @returns {string} the language component, e.g. 'javascript'
 */
module.exports.languageFromContentType = function(contentType) {
  let specialCases = {
    json: 'javascript',
    html: 'markup'
  };
  let languageType;
  if (contentType.indexOf('/') < 0) {
    languageType = contentType;
  }
  languageType = contentType.split('/')[1];
  return specialCases[languageType] || languageType;
};

/**
 * Joins an array of strings into a comma-separated list for visual printing.
 * For example, passing ['Bob', 'Andy', 'Nick'] would return 'Bob, Andy, Nic'.
 * @param {Array} strings Array of strings to join.
 * @returns {string} processed string
 */
module.exports.commaValues = function(strings) {
  return strings.join(', ');
};

/**
 * Converts a value into upper-case
 * @param {string} value value to be upper-cased
 * @returns {string} upper-cased string
 */
module.exports.upperCase = function(value) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
};

/**
 * Pretty-prints a JSON string from a given object
 * @param {object} object JSON-compatible javascript object
 * @param {number} [spacing] Number of spaces to use when padding the JSON.
 * If you don't specify this, you'll get minified JSON.
 * @returns {string} JSON stringified, pretty-printed by optional spacing.
 */
module.exports.json = function(object, spacing) {
  return JSON.stringify(object, null, spacing);
};

/**
 *
 * @param {Array} headingsTree
 * @returns {Handlebars.SafeString} nested ul of TOC links
 */
module.exports.toc = function(headingsTree) {
  return new Handlebars.SafeString(generateUl(headingsTree));
};

function generateUl(headingsArray) {
  return `<ul class="toc">${generateListItems(headingsArray)}</ul>`;
}

function generateListItems(headingsArray) {
  let lis = [];
  for (let heading of headingsArray) {
    lis.push(`<li class="toc-item">
               <a href="#${heading.id}">${heading.title}</a>
             </li>`);
    if (heading.children) {
      lis.push(generateUl(heading.children));
    }
  }
  return lis.join('\n');
}
