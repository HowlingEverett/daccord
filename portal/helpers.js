'use strict';

let Handlebars = require('handlebars');
let slug = require('slug');
let marked = require('marked');

/**
 * Slugifies a string, removing spaces and non-url-compatible characters, and replacing
 * them with hyphens. Also lower-cases everything. Basically creates a URL 'slug'. Gracefully
 * degrades: if you pass it a bad value, it will simply return an empty string.
 * @param {string} str input string you want to slugify
 * @returns {string} Processed string, with invalid characters replaced by hyphens
 */
module.exports.slug = function(str) {
  try {
    return slug(str, {mode: 'rfc3986'});
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
 * @param {string} contentType content type string such as 'application/javascript'
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
 * @param {array} strings Array of strings to join.
 * @returns {string} processed string
 */
module.exports.commaValues = function(strings) {
  return strings.join(', ');
};

module.exports.uppercase = function(value) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
};
