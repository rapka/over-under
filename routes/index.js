exports.routes = function(app) {
	app.get('/', exports.index);
	app.get('/blood', exports.blood);
	app.get('/static', exports.blood);
	app.get('/track/:track', exports.track)
};

exports.index = function(req, res) {
	res.render('index', {});
};

exports.blood = function(req, res) {
	res.render('blood', {});
};

exports.track = function(req, res) {
	
	var options = {
		root: __dirname + '/../tracks/',
		headers: {
				'x-timestamp': Date.now(),
				'x-sent': true
		}
	};

	var fileName = req.params.track;
	res.sendFile(fileName, options, function (err) {
		if (err) {
			console.log(err);
			res.status(err.status).end();
		}
		else {
			console.log('Sent:', fileName);
		}
	});
};