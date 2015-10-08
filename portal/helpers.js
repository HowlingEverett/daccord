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

module.exports.markdown = function(markdownString) {
  return new Handlebars.SafeString(marked(markdownString));
};
