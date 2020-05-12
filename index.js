const schedule = require('node-schedule');

const axios = require('axios').default;
const {
	DISCORD_APP_CLIENT_ID,
	DISCORD_BOT_MASTER_SERVER_ID,
	DISCORD_BOT_TOKEN,
	DISCORD_BOT_USERNAME,
	IMPRESSLIST_URL,
	IMPRESSLIST_API_KEY,
	EC2_SERVER
} = require('./config');

const BOT_PREFIX = "cb!";
const BOT_COLOR = 0x00e174;
const BOT_ERROR_COLOR = 0xff0000;
const BOT_ICON = "https://cdn.discordapp.com/avatars/204961596991078400/caee0faadb5d223044c06d8691943158.png?size=256";
const BOT_VERSION = "0.1.0";
const BOT_COPYRIGHT = "© Coverage Bot ~ made with love by Force Of Habit!";

const BOT_DESCRIPTION = `A bot that tracks mentions of your game & keywords across the internet.`;
const BOT_FEATURES = `**Coverage Tracking**
• Looks at thousands of YouTube channels, Twitch streamers and traditional web/game publications, and posts your coverage to your community.

** Analytics & Reporting **
• Provides stats on your coverage - views, likes, comments - where possible.
`;
/*
• Fully browsable Coverage results - view alphabetically, by most recent or by various search terms.
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
		dataStr += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
	}
	let url = IMPRESSLIST_URL + "/api.php?endpoint=" + endpoint + dataStr;
	//console.log(url);

	return new Promise((resolve, reject) => {
		axios(url).then((response)=>{
			//console.log(response);
			resolve(response);
		})
	});

}

// Commands:
// Core functionality (implemented)
// cb!latest						what coverage you've had most recently
// cb!random 						random piece of coverage
// cb!stats today					stats on how much coverage you've had in last 24 hours --- x new videos : x minutes, x views/favorites/comments/etc., x new articles
// cb!stats week 					stats on how much coverage you've had this week
// cb!stats month					stats on how much coverage you've had this month
// cb!stats all						stats on how much coverage you've had all time.
// cb!about 						who made it / how to support it.
// cb!help							list commands
// cb!search {terms} 				search pieces of coverage by string
// cb!search {limit} {terms} 		search pieces of coverage by string

// cb!submit {link}					submit a piece of coverage. (should be approved within 24 hrs)

// Core functionality (todo)
// cb!configure 					start form of inputting game details, etc.
// cb!report {link}					report a piece of coverage. (should be deleted within 24 hrs) e.g. https://discordapp.com/channels/303545432724996106/556878611639173131/706557496524931155
// cb!game 							info about the game.
// cb!presskit 						link to press kit
// cb!uninstall? 					sadface
// cb!donate 						link to patreon
// cb!servers  						list of cool games supporting coverage bot, include server links? appear at top of list for higher donations?
//									{alphabetical, popular, default}
// cb!supporters 					list of cool discord users supporting coverage bot. get in the list by patreonining.
// cb!join							join force of habit's server?

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

let genCoverageItemMessage = async (channel, coverageItem) => {
	console.log("coverageItem", coverageItem);
	if (coverageItem.type == "youtuber") {
		await channel.createMessage("**Video:** " + coverageItem.url);
	}
	else {
		await channel.createMessage("**Article:** " + coverageItem.url);
	}
};

let genCoverageList = async (channel, coverageList) => {
	for(let index in coverageList) {
		let item = coverageList[index];
		await genCoverageItemMessage(channel, item);
	}
}

let genCoverageStatsMessages = async (channel, title, statsResults) => {
	await channel.createMessage(genTitleMessage(title))
	const nl = "\n"

	let statsMessage = "";
	statsMessage += "**YouTube:**"+nl;
	statsMessage += "```";
	statsMessage += "Videos:     " + parseInt(statsResults.data.stats.youtube.videoCount).toLocaleString() + nl;
	statsMessage += "Views:      " + parseInt(statsResults.data.stats.youtube.viewCount).toLocaleString() + nl;
	statsMessage += "Likes:      " + parseInt(statsResults.data.stats.youtube.likeCount).toLocaleString() + nl;
	statsMessage += "Dislikes:   " + parseInt(statsResults.data.stats.youtube.dislikeCount).toLocaleString() + nl;
	statsMessage += "Comments:   " + parseInt(statsResults.data.stats.youtube.commentCount).toLocaleString() + nl;
	statsMessage += "```";
	statsMessage += "**Articles:**"+nl;
	statsMessage += "```";
	statsMessage += "Total:      " + parseInt(statsResults.data.stats.articles.count).toLocaleString() + nl;
	statsMessage += "```";
	await channel.createMessage(statsMessage);
	await channel.createMessage(genFooter());
};

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
let genError = (message) => {
	return {
		embed: {
			color: BOT_ERROR_COLOR,
			footer: {
				text: "Error! " + message
			}
		}
	};
}
let genSuccess = (message) => {
	return {
		embed: {
			color: BOT_COLOR,
			footer: {
				text: message
			}
		}
	};
}

let startStatsRequest = (msg, title, guildId, duration) => {
	return new Promise((resolve, reject) => {
			apiGetRequest("/bot/stats", guildId, {
				duration: duration
			})
				.then((results)=>{
					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}
					try {
						genCoverageStatsMessages(msg.channel, title, results)
							.then((result) => {
								resolve(result);
							})
							.catch((e) => {
								reject(e);
							})

					} catch(e) {
						reject();
					}

				})
				.catch((e)=>{
					reject(e);
				});
		});
};

const commandForName = {};
const helpStr = "`"+BOT_PREFIX+'help` for my commands!';
commandForName['about'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Show 'about' page.",
	paramsOptions: [],
	visible: true,
	execute: (server, msg, args) => {
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
						value: "[Twitter](http://twitter.com/forcehabit) | [Facebook](http://facebook.com/forcehabit) | [YouTube](http://youtube.com/forcehabit) | [Instagram](http://instagram.com/forceofhabitgames) | [Patreon](http://patreon.com/forceofhabit) | [Website](http://forceofhab.it)",
						inline: false
					},
					{
						name: "Want your own Coverage Bot?",
						value: `• Support on [Patreon](http://patreon.com/forceofhabit) for just $2 per month.
								• Join the [Discord](http://discord.gg/forceofhabit)!`,
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


commandForName['latest'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Show latest piece of coverage.",
	paramsOptions: [],
	visible: true,
	execute: async (server, msg, args) => {

		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/latest", msg.channel.guild.id)
				.then(async (results)=>{
					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}
					//console.log(results);

					try {
						await msg.channel.createMessage(genTitleMessage("Most Recent Coverage"))
						for(let index in results.data.coverage) {
							let item = results.data.coverage[index];
							await genCoverageItemMessage(msg.channel, item);
						}
						await msg.channel.createMessage(genFooter());
						resolve();
					} catch (e) {
						console.error(e);
						reject(e);
					}

				})
				.catch((e)=>{
					reject(e);
				});
		});
	}
};


commandForName['random'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Get random piece of coverage.",
	paramsOptions: [],
	visible: true,
	execute: (server, msg, args) => {
		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/random", msg.channel.guild.id)
				.then(async(results)=>{
					//console.log("results", results);

					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}

					try {
						await msg.channel.createMessage(genTitleMessage("Random Coverage"))
						for(let index in results.data.coverage) {
							console.log(index);
							let item = results.data.coverage[index];
							await genCoverageItemMessage(msg.channel, item);
						}
						await msg.channel.createMessage(genFooter());
						resolve();
					}
					catch(e) {
						console.warn(e);
						reject();
					}
					reject();
				})
				.catch((e) => {
					reject(e);
				});
		});
	}
};


commandForName['stats'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Show Coverage Stats.",
	paramsOptions: [
		["today"],
		["week"],
		["month"],
		["year"],
		["all"],
	],
	visible: true,
	execute: async (server, msg, args) => {
		let duration = "all";
		let durationDesc = "All time";
		if (args.length == 1) {
			if (args[0] == "today" || args[0] == "week" || args[0] == "month"  || args[0] == "year") {
				duration = args[0];
				durationDesc = duration.substr(0, 1).toUpperCase() + duration.substr(1);
			}
		}
		return await startStatsRequest(msg, "Coverage Stats - "+durationDesc, msg.channel.guild.id, duration);
	}
};
commandForName['search'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Search for piece of coverage.",
	paramsOptions: [
		["{query}"],
		["{limit}", "{query}"],
		["{limit}", "{page}", "{query}"]
	],
	visible: true,
	execute: async (server, msg, args) => {

		let data;
		if (args.length == 1) {
			data = {
				q: args[0]
			}
		}
		else if (args.length == 2) {
			data = {
				limit: args[0],
				q: args[1]
			}
		}
		else if (args.length >= 3) {
			const finalArg = args.slice(2).join(" ");
			data = {
				limit: args[0],
				page: args[1],
				q: finalArg
			}
		}

		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/search", msg.channel.guild.id, data)
				.then(async (results)=>{
					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}

					try {
						await msg.channel.createMessage(genTitleMessage("Search Coverage - Results"))
						if (results.data.coverage.length == 0) {
							await msg.channel.createMessage("No Results.");
						}
						else {
							await genCoverageList(msg.channel, results.data.coverage);
						}
						await msg.channel.createMessage(genFooter());
						resolve();
					} catch (e) {
						console.error(e);
						reject(e);
					}

				})
				.catch((e)=>{
					reject(e);
				});
		});
	}
};

commandForName['submit'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Submit your coverage!",
	paramsOptions: [
		["{url}"]
	],
	visible: true,
	execute: async (server, msg, args) => {
		if (args.length !== 1) {
			return msg.channel.createMessage(genError("Invalid url."));
		}
		let url = args[0];
		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/submit", msg.channel.guild.id, {
				url: url
			})
				.then((results)=>{
					//console.log("results", results);

					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}

					msg.channel.createMessage(genSuccess("Thank you for your submission!"))
						.then((d)=>{
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
commandForName['games'] = {
	botOwnerOnly: false,
	botModeratorOnly: false,
	description: "Show teams/games using Coverage Bot.",
	paramsOptions: [],
	visible: true,
	execute: async (server, msg, args) => {
		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/games", msg.channel.guild.id)
				.then((results)=>{
					//console.log("results", results);

					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}

					let fields = []
					for(let index in results.data.companies) {
						let company = results.data.companies[index];
						let values = [];
						if (company.discord.length > 0) {
							values.push("[Discord](" + company.discord+")");
						}
						if (company.website.length > 0) {
							values.push("[Website](" + company.website+")");
						}
						if (company.twitter.length > 0) {
							values.push("[Twitter](https://twitter.com/" + company.twitter+")");
						}
						if (company.facebook.length > 0) {
							values.push("[Facebook](https://facebook.com/" + company.facebook+")");
						}
						let value = values.join(" | ");
						fields.push({
							name: company.name,
							value: value,
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
	botModeratorOnly: false,
	description: "Show this command list.",
	paramsOptions: [],
	visible: true,
	execute: (server, msg, args) => {
		let fields = [];
		for (let command in commandForName) {
			let commandStart = "`" + BOT_PREFIX + command + "`";

			if (!commandForName[command].visible) {
				continue;
			}
			if (commandForName[command].botModeratorOnly && !isMessageFromModerator(server, msg)) {
				continue;
			}
			if (commandForName[command].paramsOptions.length > 0) {
				let orders = "";
				for (let paramOption in commandForName[command].paramsOptions) {
					orders += commandStart + " `"+commandForName[command].paramsOptions[paramOption].join("` `") + "`\n";
				}

				fields.push({
					name: orders,
					value: commandForName[command].description,
					inline: false
				});
			}
			else {
				fields.push({
					name: commandStart,
					value: commandForName[command].description,
					inline: false
				});
			}
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

let approveOrRejectFunc = (server, type, args) => {
	if (type != "approve" && type != "reject") {
		return new Promise((resolve, reject) => {
			reject("Invalid type: " + type);
		});
	}
	let useId = -1;
	if (server.lookout.current !== null) {
		useId = server.lookout.current.id;
	}
	else {
		// If there's not one "current" then we need to receive an id for which wwe're approving!
		useId = args[0];
	}

	if (useId > 0) {
		// approve it
		return new Promise((resolve, reject) => {
			apiGetRequest("/bot/" + type, server.id, { id: useId })
				.then(async (results)=>{
					console.log("results", results);

					if (!results.data) {
						reject("Unknown reason.");
						return;
					}
					else if (!results.data.success) {
						reject(results.data.message);
						return;
					}

					await server.modChannel.createMessage("Done.");
					server.lookout.current = null;

					if (server.lookout.queue.length == 0) {
						await server.modChannel.createMessage("No more potentials.");
					}
					else {
						advanceLookoutQueue(server)
							.then(() => {
								resolve()
							})
							.catch((e)=>{
								reject(e);
							});
					}
				});
		});
	}
	return new Promise((resolve, reject) => {
		reject("Invalid id");
	});

}

commandForName['approve'] = {
	botOwnerOnly: false,
	botModeratorOnly: true,
	description: "(MOD ONLY) Approve submitted coverage.",
	paramsOptions: [
		//[]//,
		//["{id}"]
	],
	visible: false,
	execute: (server, msg, args) => {
		if (server.lookout.current == null) {
			return server.modChannel.createMessage(genError("No coverage waiting approval. Try running `" + BOT_PREFIX + "lookout` again."))
		}
		return approveOrRejectFunc(server, "approve", args);
	}
};
commandForName['reject'] = {
	botOwnerOnly: false,
	botModeratorOnly: true,
	description: "(MOD ONLY) Reject potential coverage.",
	paramsOptions: [
		//[]//,
		//["{id}"]
	],
	visible: false,
	execute: (server, msg, args) => {
		if (server.lookout.current == null) {
			return server.modChannel.createMessage(genError("No coverage waiting approval. Try running `" + BOT_PREFIX + "lookout` again."))
		}
		return approveOrRejectFunc(server, "reject", args);
	}
};

let lookoutFunc = (server, resetQueue = true) => {
	return new Promise((resolve, reject) => {

		apiGetRequest("/bot/potentials", server.id)
			.then((results)=>{
				console.log("results", results);

				if (!results.data) {
					reject("Unknown reason.");
					return;
				}
				else if (!results.data.success) {
					reject(results.data.message);
					return;
				}

				if (resetQueue) {
					// clear current state and reset it into the queue.
					if (server.lookout.current != null) {
						server.lookout.queue = [
							server.lookout.current,
							...server.lookout.queue
						];
						server.lookout.current = null;
					}

					if (results.data.potentials.length == 0) {
						server.modChannel.createMessage("No potentials.");
						resolve();
						return;
					}
				}

				let existsIds = [];
				for (let i = 0; i < server.lookout.queue.length; i++) {
					existsIds.push(server.lookout.queue[i].id);
				}

				// add new coverage to queue.
				for (let i = 0; i < results.data.potentials.length; i++) {
					const p = results.data.potentials[i];
					if (existsIds.indexOf(p.id) == -1) {
						server.lookout.queue.push(p);
					}
				}
				advanceLookoutQueue(server)
					.then(()=>{
						resolve();
					})
					.catch((e) => {
						reject(e);
					})

			});
	});
};

commandForName['lookout'] = {
	botOwnerOnly: false,
	botModeratorOnly: true,
	description: "(MOD ONLY) Review potential coverage.",
	paramsOptions: [
		//[]
	],
	visible: true,
	execute: async (server, msg, args) => {
		await server.modChannel.createMessage("Coming right up!");
		return lookoutFunc(server, true);
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

const allServers = {

};

let isMessageFromModerator = (server, msg) => {
	return msg.member.roles.indexOf(server.modRole.id) >= 0;
}

// Every time a message is sent anywhere the bot is present,
// this event will fire and we will check if the bot was mentioned.
// If it was, the bot will attempt to respond with "Present".
bot.on('messageCreate', async (msg) => {
	// Ignore any messages sent as direct messages.
	// The bot will only accept commands issued in a guild.
	console.log("Processing message...");

	// Ignore messages from other bots and system messages
	if (msg.author.bot || msg.author.system || msg.author.username == DISCORD_BOT_USERNAME) {
		return;
	}

	// Give "about" info in any private messages.
	if (!msg.channel.guild) {
		await commandForName['about'].execute(null, msg, []);
		//await commandForName['games'].execute(null, msg, []);
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

	// Make sure the server has a role for bot admins/moderators.
	let modRoleData = {
		name: "Coverage Bot (Moderator)",
		hoise: false,
		mentionable: false,
		managed: true
	};

	let everyoneRole = msg.channel.guild.roles.find((role) => { return role.name == "@everyone"; });
	let botRole = msg.channel.guild.roles.find((role) => { return role.name == "Coverage Bot"; });
	let foundModRole = msg.channel.guild.roles.find((role) => { return role.name == modRoleData.name});
	if (foundModRole == null) {
		console.log('Creating coverage bot moderation role');
		//console.log('modRoleData', modRoleData);
		let role;
		try {
			role = await bot.createRole(msg.channel.guild.id, modRoleData, "Coverage Bot - moderators role - people who can report submit new coverage and report false coverage!")
		} catch (e) {
			//console.warn(e);
		}
		//console.log('role', role);
		foundModRole = role;
	}
	// assign role to owner id
	if (foundModRole !== null) {
		try {
			//console.log('foundModRole', foundModRole);
			//console.log('msg.channel', msg.channel);
			console.log("Adding role to owner.");
			await bot.addGuildMemberRole(msg.channel.guild.id, foundModRole.guild.ownerID, foundModRole.id, "Coverage Bot - moderators role - give owner the role.");
		} catch (e) {
			//console.warn(e);
		}
	} else {
		console.log("could not get/create mod role in ", msg.channel.guild.name, foundModRole)
	}

	//console.log("roles", msg.channel.guild.roles);

	let internalModChannel = {
		name: "coverage-moderation",
		options: {
			topic: "Coverage Bot - Moderation - use `cb!help` for commands.",
			reason: "Coverage Bot - moderation channel",
			permissionOverwrites: [
				new eris.PermissionOverwrite({
					id: everyoneRole.id,
					type: "role",
					allow: 0,
					deny: eris.Constants.Permissions.all
				}),
				new eris.PermissionOverwrite({
					id: foundModRole.id,
					type: "role",
					allow: eris.Constants.Permissions.readMessages | eris.Constants.Permissions.sendMessages |
							eris.Constants.Permissions.embedLinks |
							eris.Constants.Permissions.manageMessages | eris.Constants.Permissions.readMessageHistory,
					deny: 0
				})
			]
		}
	}
	if (botRole !== null) {
		internalModChannel.options.permissionOverwrites.push(
			new eris.PermissionOverwrite({
				id: botRole.id,
				type: "role",
				allow: eris.Constants.Permissions.readMessages | eris.Constants.Permissions.sendMessages |
						eris.Constants.Permissions.embedLinks |
						eris.Constants.Permissions.manageMessages | eris.Constants.Permissions.readMessageHistory,
				deny: 0
			})
		);
	}
	let foundModChannel = msg.channel.guild.channels.find((channel) => { return channel.name == internalModChannel.name; })
	if (!foundModChannel) {
		foundModChannel = await bot.createChannel(msg.channel.guild.id, internalModChannel.name, 0, internalModChannel.options);
		// console.log('modChannel', modChannel);
	}

	// esnsure server is in in memory bot server list.
	let thisServer = null;
	let allServerIds = Object.keys(allServers);
	if (allServerIds.indexOf(msg.channel.guild.id) === -1) {
		thisServer = {
			id: msg.channel.guild.id,
			ownerId: msg.channel.guild.ownerID,
			modChannel: foundModChannel,
			modRole: foundModRole,
			lookout: {
				current: null,
				queue: []
			}
		};
		allServers[thisServer.id] = thisServer;
		console.log("added server", thisServer.id);
	}
	else {
		thisServer = allServers[msg.channel.guild.id];
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

	//console.log( 'msg', msg );
	//console.log( );
	// msg.author.id
	// msg.member.id
	//
	//msg.author.username
	//msg.author.discriminator
	if (command.botModeratorOnly && !isMessageFromModerator(thisServer, msg)) {
		await msg.channel.createMessage(genError("Only Coverage Bot Moderators (Role) can use this command. "));
		return;
	}

	const args = parts.slice(1);
	try {
		await command.execute(thisServer, msg, args)
	}
	catch (err) {
		// There are various reasons why sending a message may fail.
		// The API might time out or choke and return a 5xx status,
		// or the bot may not have permission to send the
		// message (403 status).
		console.warn('Failed to respond to mention.');
		console.warn(err);
		await msg.channel.createMessage(genError(err));

	}
});

bot.on('error', err => {
	console.warn(err);
});

bot.connect();

let advanceLookoutQueue = async (server) => {
	if (server.lookout.current == null && server.lookout.queue.length > 0) {

		let current = server.lookout.queue.shift();
		let str = "";
		str += "**Potential Coverage:**\n";
		//str += "(Coverage should be original and not trailer re-posts, etc.)\n";
		str += "**URL:** " + current.url + "\n\n";
		str += "Reply with `cb!approve` or `cb!reject`.\n";

		let message = await server.modChannel.createMessage(str);
		server.lookout.current = current;
		server.lookout.current.message = message;

	}
};

// Lookout schedule
const nineAMEveryDay = '0 9 * * *';
const everyMinute = '* * * * *';
const everyHour = '0 * * * *';
const every5Secs = '*/12 * * * *';
schedule.scheduleJob(nineAMEveryDay, async function() {
	// behave like we just received a cb!lookout?
	// for every server, pull /bot/potentials, add them to the queue (if they're not in there already!), and start the approve process.
	let allServerIds = Object.keys(allServers);
	for(let i = 0; i < allServerIds.length; i++) {
		const server = allServers[allServerIds[i]];
		lookoutFunc(server, true); // commandForName['lookout'].execute(server, null, []);
	}
});
schedule.scheduleJob(everyHour, async function() {
	// for every server, pull /bot/potentials and add them to the queue.
	let allServerIds = Object.keys(allServers);
	for(let i = 0; i < allServerIds.length; i++) {
		const server = allServers[allServerIds[i]];
		lookoutFunc(server, false); // await advanceLookoutQueue(server);
	}
});


