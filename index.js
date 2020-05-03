const axios = require('axios').default;
const {
	DISCORD_APP_CLIENT_ID,
	DISCORD_BOT_TOKEN,
	DISCORD_BOT_USERNAME
	IMPRESSLIST_URL,
	IMPRESSLIST_API_KEY,
	EC2_SERVER
} = require('./config');

const BOT_PREFIX = "cb!";
const BOT_COLOR = 0x00e174;
const BOT_ICON = "https://cdn.discordapp.com/avatars/204961596991078400/caee0faadb5d223044c06d8691943158.png?size=256";
const BOT_VERSION = "0.1.0";
const BOT_COPYRIGHT = "© Coverage Bot ~ made with love by Force Of Habit!";

const BOT_DESCRIPTION = `A bot that tracks mentions of your game & keywords across the internet.`;
const BOT_FEATURES = `**Coverage Tracking**
• Looks at thousands of YouTube channels, Twitch streamers and traditional web/game publications, and posts your coverage to your community.
`;/*
• Fully browsable Coverage results - view alphabetically, by most recent or by various search terms.

** Analytics & Reporting **
• Provides stats on your coverage - views, likes, comments - where possible.
• Provides a daily/weekly/monthly Coverage report.

** Community & Engagement **
• Allows your community to submit their own articles/videos.
• Integrates with presskit() by providing a link on \`${BOT_PREFIX}presskit\` command.
`;*/

function apiGetRequest(endpoint, server, data = {}) {
	let dataStr = "";
	dataStr += "&key=" + encodeURIComponent(IMPRESSLIST_API_KEY);
	dataStr += "&server=" + encodeURIComponent(server);
	for(let key in data) {
		dataStr = "&" + encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
	}
	let url = IMPRESSLIST_URL + "/api.php?endpoint=" + endpoint + dataStr;
	console.log(url);

	return new Promise((resolve, reject) => {
		axios(url).then((response)=>{
			console.log(response);
			resolve(response);
		})
	});

}

// Commands:
// Core functionality
// cb!mostrecent					what coverage you've had most recently
// cb!today							what/how much coverage you've had in last 24 hours
// cb!week 							what/how much coverage you've had this week
// cb!month 						what/how much coverage you've had this month
// cb!all 							how much coverage you've had all time.
// cb!count 						^^?
// cb!stats 						^^?
// cb!random 						random piece of coverage
// cb!search {terms} 				search pieces of coverage by string
// cb!search {num_results} {terms} 	search pieces of coverage by string
// cb!game 							info about the game.
// cb!presskit 						link to press kit
// cb!submit {link}					submit a piece of coverage. (should be approved within 24 hrs)
// cb!report {link}					report a piece of coverage. (should be deleted within 24 hrs) e.g. https://discordapp.com/channels/303545432724996106/556878611639173131/706557496524931155
// cb!configure 					start form of inputting game details, etc.
// cb!uninstall? 					sadface
// cb!about 						who made it / how to support it.
// cb!donate 						link to patreon
// cb!servers  						list of cool games supporting coverage bot, include server links? appear at top of list for higher donations?
//									{alphabetical, popular, default}
// cb!supporters 					list of cool discord users supporting coverage bot. get in the list by patreonining.
// cb!join							join force of habit's server?
// cb!help							list commands

// Future functionality
// cb!best {views, likes, subscribers, minutes}
// cb!alphabetical 					alphabetical list of coverage (10 per page)
// cb!alphabetical {page}   		alphabetical list of coverage - next page (10 per page)
// cb!latest 						list of coverage by most recent (10 per page)
// cb!latest {page}					list of coverage by most recent -  next page (10 per page) (/list page)
// cb!blacklist {terms}
// cb!whatsnew 						show version history

let genTitleMessage = (title = "Most Recent Coverage") => {
	return {
		embed: {
			color: BOT_COLOR,
			title: title,
			//description: "1 result/s"
		}
	};
}
let genFooter = () => {
	return {
		embed: {
			color: BOT_COLOR,
			footer: {
				text: BOT_COPYRIGHT,
				icon_url: BOT_ICON
			}
		}
	};
}

const commandForName = {};
const helpStr = "`"+BOT_PREFIX+'help` for my commands!';
commandForName['about'] = {
	botOwnerOnly: false,
	description: "Show 'about' page.",
	execute: (msg, args) => {
		return msg.channel.createMessage({
			embed: {
				title: "About Coverage Bot",
				color: BOT_COLOR,
				fields: [
					{
						name: "What is Coverage Bot?",
						value: BOT_DESCRIPTION,
						inline: false
					},
					{
						name: "Features",
						value: BOT_FEATURES,
						inline: false
					},
					{
						name: "Developer",
						value: "[Force Of Habit](https://forceofhab.it/)", //  / Ashley Gwinnell
						inline: false
					},
					{
						name: "Socials",
						value: "[Twitter #1](http://twitter.com/forcehabit) | [Facebook](http://facebook.com/forcehabit) | [YouTube](http://youtube.com/forcehabit) | [Instagram](http://instagram.com/forceofhabitgames) | [Patreon](http://patreon.com/forceofhabit) | [Website](http://forceofhab.it)",
						inline: false
					},
					{
						name: "Want your own Coverage Bot?",
						value: `• Support on [Patreon](http://patreon.com/forceofhabit) for just $2 per month.
								• Join the [Discord](http://forceofhab.it/discord)!`,
						inline: false
					},
					{
						name: "Version",
						value: BOT_VERSION,
						inline: false
					}
				],
				footer: genFooter().embed.footer
			}
		});
	}
};
commandForName['mostrecent'] = {
	botOwnerOnly: false,
	description: "Show latest piece of coverage.",
	execute: async (msg, args) => {

		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/mostrecent", msg.channel.guild.id)
				.then(async (results)=>{
					if (!results.data || !results.data.success) {
						reject();
						return;
					}
					//console.log(results);

					await msg.channel.createMessage(genTitleMessage("Most Recent Coverage"));
					for(let index in results.data.coverage) {
						let item = results.data.coverage[index];
						console.log("item", item);
						if (item.type == "youtuber") {
							await msg.channel.createMessage("**Video:** " + item.url);
						}
						else {
							await msg.channel.createMessage("**Article:** " + item.url);
						}
					}
					await msg.channel.createMessage(genFooter());
					resolve();

				})
				.catch((e)=>{
					reject(e);
				});
		});

		// [Guide](https://discordjs.guide/ 'optional hovertext') -- only in description and field values.
		// https://discordapp.com/developers/docs/resources/channel#embed-object
		//const mostRecentResult = Stub_PublicationCoverageItem;
		// const url = mostRecentResult.data.url;
		// if (mostRecentResult.type == "youtube") {
		// 	return Promise.all([
		// 		msg.channel.createMessage(genTitleMessage("Most Recent Coverage")),
		// 		msg.channel.createMessage("**Video:** " + url),
		// 		msg.channel.createMessage(genFooter())
		// 	]);
		// }
		// else if (mostRecentResult.type == "publication") {
		// 	return Promise.all([
		// 		msg.channel.createMessage(genTitleMessage("Most Recent Coverage")),
		// 		msg.channel.createMessage("**Article:** " + url),
		// 		msg.channel.createMessage(genFooter())
		// 	]);
		// }
	}
};
//commandForName['thanks'] =
commandForName['games'] = {
	botOwnerOnly: false,
	description: "Show teams/games using Coverage Bot.",
	execute: async (msg, args) => {
		// let fields = [];
		// for (let team in TEAMS) {
		// 	fields.push({
		// 		name: TEAMS[team].name,
		// 		value: TEAMS[team].website,
		// 		inline: false
		// 	});
		// }

		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/games", msg.channel.guild.id)
				.then((results)=>{
					//console.log("results", results);

					if (!results.data || !results.data.success) {
						reject();
						return;
					}

					let fields = []
					for(let index in results.data.companies) {
						let company = results.data.companies[index];
						fields.push({
							name: company.name,
							value: "https://twitter.com/" + company.twitter,
							inline: false
						})
					}
					msg.channel.createMessage({
						embed: {
							title: "Games",
							description: "Look at all these lovely teams/games currently using Coverage Bot.",
							color: BOT_COLOR,
							fields: fields,
							footer: genFooter().embed.footer
						}
					}).then((d)=>{
						resolve(d);
					}).catch((e)=>{
						reject(e);
					})

				})
				.catch((e) => {
					reject(e);
				});
		});



	}
};
commandForName['help'] = {
	botOwnerOnly: false,
	description: "Show this command list.",
	execute: (msg, args) => {
		let fields = [];
		for (let command in commandForName) {
			fields.push({
				name: "`"+BOT_PREFIX + command+"`",
				value: commandForName[command].description,
				inline: false
			});
		}
		return msg.channel.createMessage({
			embed: {
				title: "Help - Command List",
				//description: "These are all the commands ",
				color: BOT_COLOR,
				fields: fields,
				footer: genFooter().embed.footer
			}
		});
	}
};

function findUserInString(bot, str) {
   const lowercaseStr = str.toLowerCase();

   // Look for a matching username in the form of username#discriminator.
   const user = bot.users.find(
       user => lowercaseStr.indexOf(`${user.username.toLowerCase()}#${user.discriminator}`) !== -1,
   );

   return user;
}

/*
// console.log(msg);
// console.log(JSON.stringify(msg));
// msg.timestamp;
// msg.channel.id;
// msg.channel.client.user;
// msg.channel.guild.id; // server id
// msg.channel.guild.name; // server name
// msg.author.id;
// msg.author.username + msg.author.discriminator;
// msg.member.id
*/

const eris = require('eris');

// Create a Client instance with our bot token.
const bot = new eris.Client(DISCORD_BOT_TOKEN);

// When the bot is connected and ready, log to console.
bot.on('ready', () => {
	console.log('Connected and ready to proceed.');
});

// Every time a message is sent anywhere the bot is present,
// this event will fire and we will check if the bot was mentioned.
// If it was, the bot will attempt to respond with "Present".
bot.on('messageCreate', async (msg) => {
	// Ignore any messages sent as direct messages.
	// The bot will only accept commands issued in a guild.
	console.log("Processing message...");
	//console.log(msg);

	// Ignore messages from other bots and system messages
	if (msg.author.bot || msg.author.system || msg.author.username == DISCORD_BOT_USERNAME) {
		return;
	}

	// Give "about" info in any private messages.
	if (!msg.channel.guild) {
		await commandForName['about'].execute(msg, []);
		//await commandForName['games'].execute(msg, []);
		//await msg.channel.createMessage(helpStr + "\nMy commands are only valid inside Discord servers though!");
		//await msg.channel.createMessage("");
		return;
	}

	// Give 'help' command in any mentions.
	const botWasMentioned = msg.mentions.find((mentionedUser) => { return mentionedUser.id === bot.user.id; });
	if (botWasMentioned) {
		await msg.channel.createMessage(helpStr);
		return;
	}



	// Ignore any message that doesn't start with the correct prefix.
	const content = msg.content;
	if (!content.startsWith(BOT_PREFIX)) {
		return;
	}

	// Extract the parts and name of the command
	const parts = content.split(' ').map(s => s.trim()).filter(s => s);
	const commandName = parts[0].substr(BOT_PREFIX.length);

	// Get the requested command, if there is one.
	const command = commandForName[commandName];
	if (!command) {
		return;
	}
	const args = parts.slice(1);
	try {
		await command.execute(msg, args)
	}
	catch (err) {
		// There are various reasons why sending a message may fail.
		// The API might time out or choke and return a 5xx status,
		// or the bot may not have permission to send the
		// message (403 status).
		console.warn('Failed to respond to mention.');
		console.warn(err);
	}
});

bot.on('error', err => {
	console.warn(err);
});

bot.connect();
