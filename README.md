# GitBot

You will need to create a `config.json` file in the root directory where this is installed.

```json
{
	"secret": "Github Secret Token",
	"irc": {
		"channel": "#channel",
		"server": "irc.freenode.net",
		"botname": "MyBot"
	},
	"main_repository": "PufferPanel/GitBot"
}
```

```
git clone https://github.com/PufferPanel/GitBot.git
npm install
npm start
```
