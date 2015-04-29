/**
 * GitBot – the simple github IRC bot.
 * Licensed under a LGPL-v3 license.
 */

var restify = require("restify"),
	async = require("async"),
	config = require("../../config.json"),
	gi = require("gi"),
	irc = require("irc"),
	crypto = require("crypto"),
	hmac,
	bot = new irc.Client(config.irc.server, config.irc.botname, {
		channels: [ config.irc.channel ]
	}),
	rest = restify.createServer({
		name: "GitBot"
	});

rest.use(restify.bodyParser());
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

	async.series([
		function(callback) {

			hmac = crypto.createHmac('sha1', config.secret);
			hmac.setEncoding('hex');

			hmac.end(JSON.stringify(req.params), function () {

				var returnedHMAC = hmac.read();
				if(req.headers['x-hub-signature'] != "sha1=" + returnedHMAC) {
					res.send(403, {"error": "sha1=" + returnedHMAC});
				} else {
					callback();
				}

			});

		},
		function(callback) {

			switch(req.headers['x-github-event']) {

				case 'push':
					githubPush(req.params);
					break;
				case 'create':
					githubCreate(req.params);
					break;
				case 'delete':
					githubDelete(req.params);
					break;
				case 'issues':
					githubIssue(req.params);
					break;
				case 'pull_request':
					githubPullRequest(req.params);
					break;
				case 'release':
					githubRelease(req.params);
					break;

			}

			//console.log(req.params);

			res.send(204);

		}
	]);

});

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

// Data Pushed
function githubPush(data) {

	var shortenedURL;
	async.series([
		function(callback) {

			gi(data.head_commit.url, function(error, result) {

				if(error) {
					console.log("An error occured while trying to shorten the URL.");
				}

				shortenedURL = result;
				callback();

			});

		},
		function(callback) {

			var message = "[\u000313" + data.repository.name + "/" + data.ref.split('/').pop() + "\u000f] \u000315" + data.head_commit.author.username + "\u000f pushed " + data.commits.length + " new commit(s) to master (+" + data.head_commit.added.length + " -" + data.head_commit.removed.length + " \u00B1" + data.head_commit.modified.length + ") " + shortenedURL;

			bot.say(config.irc.channel, message);

			async.eachSeries(data.commits, function(commit, callback) {

				bot.say(config.irc.channel, "    \u000314" + commit.id.substring(0, 9) + "\u000f \u000315" + commit.committer.username + "\u000f: " + commit.message.substr(0, 300));

			});

		}
	]);

}

function githubCreate(data) {

	var message = "[\u000313" + data.repository.name + "\u000f] \u000315" + data.respository.sender.login + "\u000f \u000309created\u000f " + data.ref_type + " " + data.ref;
	bot.say(config.irc.channel, message);

}

function githubDelete(data) {

	var message = "[\u000313" + data.repository.name + "\u000f] \u000315" + data.respository.sender.login + "\u000f \u000304deleted\u000f " + data.ref_type + " " + data.ref;
	bot.say(config.irc.channel, message);

}

function githubIssue(data) {

	var shortenedURL,
		ignoreIssues = [
			"assigned",
			"unassigned",
			"labeled",
			"unlabeled"
		];

	if(ignoreIssues.indexOf(data.action) > -1) {
		return;
	}

	async.series([
		function(callback) {

			gi(data.issue.url, function(error, result) {

				if(error) {
					console.log("An error occured while trying to shorten the URL.");
				}

				shortenedURL = result;
				callback();

			});

		},
		function(callback) {

			var message = "[\u000313" + data.repository.name + "\u000f] \u000315" + data.issue.user.login + "\u000f " + data.action + " Issue #" + data.issue.number
							+ ": " + data.issue.title + " " + shortenedURL;

			bot.say(config.irc.channel, message);

		}
	]);

}

function githubPullRequest(data) {

	var shortenedURL,
		ignorePR = [
			"assigned",
			"unassigned",
			"labeled",
			"unlabeled",
			"synchronize"
		];

	if(ignorePR.indexOf(data.action) > -1) {
		return;
	}

	async.series([
		function(callback) {

			gi(data.pull_request.html_url, function(error, result) {

				if(error) {
					console.log("An error occured while trying to shorten the URL.");
				}

				shortenedURL = result;
				callback();

			});

		},
		function(callback) {

			var message = "[\u000313" + data.pull_request.base.repo.name + "/" + data.pull_request.base.ref + "\u000f] \u000315" + data.pull_request.user.login + "\u000f " + data.action + " Pull Request #" + data.pull_request.number
							+ ": " + data.pull_request.title + " " + shortenedURL;

			bot.say(config.irc.channel, message);

		}
	]);

}

function githubRelease(data) {

	async.series([
		function(callback) {

			gi(data.release.html_url, function(error, result) {

				if(error) {
					console.log("An error occured while trying to shorten the URL.");
				}

				shortenedURL = result;
				callback();

			});

		},
		function(callback) {

			var message = "[\u000313" + data.repository.name + "\u000f] \u000315" + data.respository.sender.login + "\u000f published release " + data.release.tag_name + ": " + data.release.name + " " + shortenedURL;
			bot.say(config.irc.channel, message);

		}
	]);

}


rest.listen(9959, function() {
	console.log("Server listening on 9959.");
});