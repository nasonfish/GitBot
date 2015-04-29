/**
 * GitBot – the simple github IRC bot.
 * Licensed under a LGPL-v3 license.
 */

var restify = require("restify"),
	async = require("async"),
	config = require("../../config.json"),
	gitio = require("gitio"),
	irc = require("irc"),
	bot = new irc.Client(config.irc.server, config.irc.botname, {
		channels: [ config.irc.channel ]
	}),
	rest = restify.createServer({
		name: "GitBot"
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

rest.get('/', function(req, res, next) {

	res.send("GitBot is Active.");

});

rest.post('/github', function(req, res, next) {

	console.log(req.headers);
	console.log(config.secret);
	// if(req.headers['X-Github-Delivery'] != config.secret) {
	// 	res.send(403);
	// }

	switch(req.headers['X-Github-Event']) {

		case 'push':
			githubPush(req.params);
			break;

	}

	console.log(req.params);

	res.send(204);

});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

// Data Pushed
function githubPush(data) {

	var shortenedURL;
	async.series([
		function(callback) {

			gitio(data.head_commit.url, function(error, result) {

				if(error) {
					console.log("An error occured while trying to shorten the URL.");
				}

				shortenedURL = result;
				callback();

			});

		},
		function(callback) {

			var message = "[\x06" + data.repository.name + "\x0F] \x15" + data.head_commit.author.username + "\x0F "
							+ data.head_commit.message +
							" (+" + data.head_commit.added.length + " -" + data.head_commit.removed.length +" \u00B1" + data.head_commit.modified.length +") "
							+ shortenedURL;

			bot.say(config.irc.channel, message);

		}
	]);

}

rest.listen(9959, function() {
	console.log("Server listening on 9959.");
});