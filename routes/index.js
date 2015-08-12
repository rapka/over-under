exports.routes = function(app) {
	app.get('/', exports.index);
	app.get('/blood', exports.blood);
};

exports.index = function(req, res) {
	res.render('index', {});
};

exports.blood = function(req, res) {
	res.render('blood', {});
}