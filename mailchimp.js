var MailChimp = function (options) {
  this.options = options || {};
};

MailChimp.prototype = {
  constructor: MailChimp,

  configure: function (options) {
    _.extend(this.options, options);
  },

  version: '2.0',

  url: 'https://:dc.api.mailchimp.com/:version/:section/:method.:format',

  dcRegExp: /us\d{1}$/i,

  apiKey: function () {
    var dc
      , key = this.options.apiKey
      || process.env.MAILCHIMP_API_KEY 
      || Meteor.settings && Meteor.settings.mailchimp_api_key;

    if (!key)
      throw new Meteor.Error('No MailChimp API key found');
    else {
      dc = this.dcRegExp.exec(key);
      if (!dc)
        throw new Meteor.Error('Unable to determine MailChimp data center');
      else
        this.dc = dc;
      return key;
    }
  },

  headers: {},

  request: function (section, method, options) {
    var url
      , query
      , response;

    options = options || {};
    options.format = options.format || 'json';

    if (arguments.length < 3)
      throw new Meteor.Error('MailChimp.prototype.request requires three parameters');

    url = this.url
      .replace(':dc', this.dc)
      .replace(':version', this.version)
      .replace(':section', section)
      .replace(':method', method)
      .replace(':format', options.format);

    params = _.omit(options, 'format');

    response = Meteor.http.post(url, {
      data: _.extend(params, {apiKey: this.apiKey()}),
      headers: this.headers
    });

    return this.onResponse(response);
  },

  onResponse: function (response) {
    if (response.statusCode !== 200)
      throw new Meteor.Error('Error sending request to MailChimp', response.statusCode);
    return EJSON.parse(response.content);
  },

  lists: {
    listByName: function (name) {
      var result = this.request('lists', 'list', {
        filters: {
          list_name: name
        }
      });

      if (result.total == 0)
        throw new Meteor.Error('MailChimp list "' + name + '" not found');

      return result.data[0];
    },

    /**
     * @param {Object} [options]
     * @param {Boolean} [options.double_optin]
     * @return {Object}
     *  {
     *    email: {String},
     *    euid: {String},
     *    leid: {String},
     *  }
     */

    subscribe: function (listName, email, options) {
      options = options || {};
      return this.request('lists', 'subscribe', _.extend({
        id: this.listByName(listName).id,
        email: {
          email: email
        }
      }, options));
    },

    /**
     * @param {Object} [options]
     * @param {Boolean} [options.delete_member]
     * @param {Boolean} [options.send_goodbye]
     * @param {Boolean} [options.send_notify]
     * @return {Object}
     *  {
     *    email: {String},
     *    euid: {String},
     *    leid: {String},
     *  }
     */

    unsubscribe: function (listName, email, options) {
      options = options || {};
      return this.request('lists', 'unsubscribe', _.extend({
        id: this.listByName(listName).id,
        email: {
          email: email
        }
      }, options));
    },

    /**
     * @return {Object}
     *  {
     *    email: {String},
     *    euid: {String},
     *    leid: {String},
     *  }
     */
    updateMember: function (listName, email, options) {
      options = options || {};
      return this.request('lists', 'update-member', _.extend({
        id: this.listByName(listName).id,
        email: {
          email: email
        }
      }, options));
    }
  }
};

MailChimp = new MailChimp;
