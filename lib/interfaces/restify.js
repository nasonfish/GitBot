/**
 * GitBot – the simple github IRC bot.
 * Licensed under a LGPL-v3 license.
 */

var restify = require("restify"),
	async = require("async"),
	config = require("../../config.json"),
	rest = restify.createServer({
		name: "GitBotß"
	});

rest.use(restify.bodyParser({ mapParams: true }));
rest.use(restify.authorizationParser());
rest.use(restify.queryParser());
rest.use(restify.CORS());

rest.opts(/.*/, function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
    res.send(200);

    return next();

});

rest.post('/github', function(req, res, next) {

	if(req.headers['X-Github-Delivery'] != config.secret) {
		res.send(403);
	}

	if

});

// Data Pushed
function githubPush(data) {



}

rest.listen(9959, function() {
	console.log("Server listening on 9959.");
});