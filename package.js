Package.describe({
  summary: 'Server Side MailChimp API Wrapper'
});

Package.on_use(function (api) {
  api.use(['ejson', 'underscore', 'http'], 'server');
  api.add_files('mailchimp.js', 'server');
  api.export('MailChimp');
});
