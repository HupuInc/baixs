exports.getLinks = function getLinks(req, res) {
  var fakeLink = {
    url: 'api.hupu.com',
    status: 200,
    description: 'A url being used by iBilling'
  };

  res.json(fakeLink);
};
