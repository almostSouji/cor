import { Guild, User, ClientUser, GuildChannel } from 'discord.js';
import { stripIndents } from 'common-tags';
import { LooseVector } from '../commands/other/dijkstra';
import { Task } from '../models/Tasks';
import { format, formatDistanceToNow } from 'date-fns';

export const DATEFORMAT = {
	DAY: 'MMM do yyy',
	MINUTE: `MMM do yyy 'at' HH:mm`
};

export const CODEBLOCK = {
	START: (language: string) => `\`\`\`${language}\n`,
	END: '\n```'
};

export const TIMEZONE = 'CET';

export const EMOJIS = {
	ONLINE: '<:online:401146192135847936>',
	OFFLINE: '<:offline:401146191645245444>',
	INVISIBLE: '<:offline:401146191645245444>',
	IDLE: '<:idle:401146191943041028>',
	DND: '<:dnd:401146192144236554>',
	STREAMING: '<:streaming:418180446195810306>',
	AUTH: '<:launch:631846294972923914>'
};

export const DISCORD_LIMITS = {
	MAX_CHANNELS: 500
};

export const EMBED_LIMITS = {
	TITLE: 256,
	DESCRIPTION: 2048,
	FOOTER: 2048,
	AUTHOR: 256,
	FIELDS: 25,
	FIELD_NAME: 256,
	FIELD_VALUE: 1024
};

export const EMBED_DEFAULT_COLOR = 3092790;

export const PREFIXES = {
	SUCCESS: '✓ ',
	ERROR: '✘ ',
	GRANTED: '`✅`',
	DENIED: '`❌`',
	NO_ACCESS: '`⛔`'
};

export const PROMPT_ANSWERS = {
	GRANTED: ['yes', 'y'],
	DENIED: ['no', 'n']
};

export const PROMPT_ANSWERS_ALL = PROMPT_ANSWERS.GRANTED.concat(PROMPT_ANSWERS.DENIED);

export const SUFFIXES = {
	PROMPT: '[y/n]'
};

export const UTIL = {
	HASTEBIN: {
		PASTE_API_BASE_URL: `https://paste.nomsy.net`
	}
};

export const COMMANDS = {
	VERSION: {
		REGEX: new RegExp(`github\.com\/(?<holder>.+)\/(?<repo>.+)\/(?<hash>[^_]+)`)
	},
	DOCS: {
		SOURCES: ['stable', 'master', 'rpc', 'commando', 'akairo', 'akairo-master', '11.5-dev', 'collection'],
		STABLE_DEV_SOURCE: '11.5-dev',
		COLLECTION_SOURCE: 'collection',
		DEV_SOURCE: 'master',
		API: {
			BASE_URL: 'https://djsdocs.sorta.moe/v2/embed?',
			STABLE_DEV_DOCS: 'https://raw.githubusercontent.com/discordjs/discord.js/docs/'
		},
		EMOJIS: {
			DELETE: '🗑'
		},
		COLORS: {
			STABLE_DEV: 16426522,
			DEV: 13650249,
			COLLECTION: 29439
		}
	},
	MDN: {
		API: {
			SEARCH_BASE_URL: 'https://mdn.pleb.xyz/search?',
			MOZ_BASE_URL: 'https://developer.mozilla.org'
		},
		MDN_ICON: 'https://i.imgur.com/DFGXabG.png',
		EMOJIS: {
			DELETE: '🗑'
		}
	},
	CRC: {
		COLORS: {
			SUCCESS: '#03b581',
			FAIL: '#d04949'
		}
	},
	DIJKSTRA: {
		COLORS: {
			SUCCESS: '#03b581',
			FAIL: '#d04949',
			WARNING: '#faa61a'
		},
		FILE_NAME: 'dijkstra_computation.txt'
	},
	TEMPROLE: {
		MIN_DURATION: 60000,
		MIN_DURATION_TEXT: '1 minute',
		DELETE_SUFFIX: ' \`🚮\`',
		DELETE_EMOJI: '🚮'
	},
	TEA: {
		MIN_DURATION: 60000,
		MIN_DURATION_TEXT: '1 minute',
		MAX_DURATION: 600000,
		MAX_DURATION_TEXT: '10 minutes'
	},
	MENSA: {
		API: {
			BASE_URL: 'https://www.mensa-kl.de',
			IMAGE_BASE_URL: 'https://www.mensa-kl.de/mimg',
			API_BASE_URL: 'https://www.mensa-kl.de/api.php'
		},
		COLORS: {
			FAIL: '#d04949',
			SUCCESS: '#03b581',
			VEG: '#86e161'
		},
		RATING_MAX: 5,
		CURRENCY_SYMBOL: '€',
		EMOJIS: {
			RATING: '⭐',
			VEG: '🥕'
		},
		DATEFORMAT: `eeee MMM do yyy`,
		DATE_ISO: `yyyy-MM-dd`
	}
};

export const MESSAGES = {
	UTIL: {
		ERRORS: {
			MAX_LENGTH: `${PREFIXES.ERROR}Document exceeds maximum length.`
		}
	},
	ERRORS: {
		RESOLVE: (input: string, type: string) => `${PREFIXES.ERROR}Can not convert \`${input}\` to \`${type}\`.`,
		TARGET: (type: string) => `${PREFIXES.ERROR}Missing argument, please provide a valid ${type}.`,
		CANCEL: `${PREFIXES.ERROR}Action cancelled.`,
		CANCEL_WITH_ERROR: (error: string) => `${PREFIXES.ERROR}Action cancelled: \`${error}\`.`,
		CATCH: `${PREFIXES.ERROR}Something went wrong.`
	},
	LOGGER: (tag: string, input: string) => `[${tag}] ${input}`,
	COMMANDS: {
		DOCS: {
			ERRORS: {
				MISSING_PERMISSIONS: (guild: Guild) => `${PREFIXES.ERROR}You are not authorized to set default logs for \`${guild.name}\``,
				INVALID_DOCS: (invalidDefault: string, sources: string[]) => `${PREFIXES.ERROR}Can not set default docs to \`${invalidDefault}\`. Please pick one of: ${sources.map(source => `\`${source}\``).join(', ')}.`,
				NONE_FOUND: (query: string) => `${PREFIXES.ERROR}Could not find the requested information for \`${query}\`.`
			},
			SUCESS: {
				SET_DEFAULT: (guild: Guild, newDefault: string) => `${PREFIXES.SUCCESS}Set the default docs for \`${guild.name}\` to \`${newDefault}\`.`

			}
		},
		MDN: {
			ERRORS: {
				NOT_FOUND: (query: string) => `${PREFIXES.ERROR}Could not find the requested information for \`${query}\`.`
			}
		},
		CRC: {
			EXPLANATIONS: {
				CHECK: stripIndents`The **C**yclic **R**edundancy **C**heck can detect all bit errors in bursts of at most the checksum length.

				If the generator is chosen well (for example according to standards) it can also detect all odd numbers of bit errors as well as even numbers of bit errors with a probability of 1 - 0.5^checksum length.`,
				CREATE: stripIndents`The **C**yclic **R**edundancy **C**heck is a method to find bit errors during transmission of data packets.

				CRC uses standardized polynomials as generators that are known by both the sending as well as the receiving party.
				The senders goal is to find \`generator length - 1\` checksum bits that, appended to the original data and XORed with the generator result in no remainder.
			
				To compute this value a padding of \`generator length - 1\` filler bits is appended to the data and the resulting padded bit sequence is XORed with the generator sequence.`
			},
			ERRORS: {
				GENERATOR_ONLY_BINARY: (generator: string) => `${PREFIXES.ERROR}Invalid generator bitstring \`${generator}\`. The generator must consist of only \`0\` and \`1\`.`,
				GENERATOR_LEFTMOST_BIT: (generator: string) => `${PREFIXES.ERROR}Invalid generator bitstring \`${generator}\`. The most significant (leftmost) bit is required to be a \`1\`.`,
				INVALID_CHECKSUM: (checksum: string) => `${PREFIXES.ERROR}Invalid CRC checksum \`${checksum}\`.`,
				CHECKSUM_LENGTH: (checksum: string) => `${PREFIXES.ERROR}Invalid CRC checksum \`${checksum}\`. The checksum has the length \`generator length - 1\`.`
			},
			WARNINGS: {
				TITLE: '[WARNING] Can not attach file',
				ENTITY_TOO_LARGE: `${PREFIXES.ERROR}Request entity too large to upload steps.`
			},
			CHECK_PASSED: `${PREFIXES.SUCCESS} passed`,
			CHECK_FAILED: `${PREFIXES.ERROR} failed`
		},
		DIJKSTRA: {
			EXPLANATION: stripIndents`Dijkstras routing algorithm is a so called **Link State (LS)** algorithm. The **centralized** algorithm computes the least-cost path between a set source and its various possible destinations using **complete, global knowledge** about the network. This means that the algorithm needs to know everything there is to know about the networks connectivity prior to the start of the computing operation. 

			After an initialization step in which all non-neighbours to the source node receive Infinity as distance (as the node doesn't know about them yet) a loop is executed. For each node in the network that the definitive shortest part is not yet known for we compare the current shortest path to the new path information obtained by the current node. The former shortest path is replaced by the new shortest path and the former predecessor by the new predecessor of said shortest path. The current node is added to the list of nodes the definitive shortest path is known for and the loop continues.
		
			After iteration the definitive shortest path and predecessor for each node in the network from the source node is known.`,
			ERRORS: {
				INVALID_VECTORS: (vectors: Array<LooseVector>) => `${PREFIXES.ERROR}Invalid vectors found: ${vectors.map(vector => `\`${vector.src}-${vector.dest}-${vector.cost}\``).join(', ')}. Vectors have the format of \`sourcename-destinationname-cost\` and are separated by spaces.`,
				NO_VECTORS: `${PREFIXES.ERROR}No valid vectors found, vectors have the format of \`sourcename-destinationname-cost\` and are separated by spaces`,
				TOO_FEW_VECTORS: `${PREFIXES.ERROR}Please provide at least three vectors, the source of the first vector will become the source of the calculation.`,
				TABLE_TOO_BIG: `${PREFIXES.ERROR}table too big, see attachment for routing table...`,
				FILE_TOO_BIG: `${PREFIXES.ERROR}File too big, select less vectors.`,
				FILE_TOO_BIG_VERBOSE: `${PREFIXES.ERROR}File too big, try to remove the \`--verbose\` flag or select less vectors.`
			}
		},
		BLACKLIST: {
			SUCCESS: {
				BLACKLIST: (user: User) => `${PREFIXES.SUCCESS}Blacklisted \`${user.tag}\` (${user.id}).`,
				UNBLACKLIST: (user: User) => `${PREFIXES.SUCCESS}Unblacklisted \`${user.tag}\` (${user.id}).`
			}
		},
		EVAL: {
			INPUT: (input: string) => `Input:${CODEBLOCK.START('js')}${input}${CODEBLOCK.END}`,
			OUTPUT: (output: string) => `Output:${CODEBLOCK.START('js')}${output}${CODEBLOCK.END}`,
			TYPE: (type: string) => `• Type: \`${type}\``,
			TIME: (diff: number) => ` • time taken: \`${diff}ms\``,
			HASTE: (hasteLink: string) => `\n• Full Inspect: ${hasteLink}`,
			ERRORS: {
				CALLBACK: (error: Error) => `${PREFIXES.ERROR}Callback error: \`${error}\`.`,
				TOO_LONG: (hasteLink: string) => `${PREFIXES.ERROR}Output too long, trying to upload it to hastebin instead: ${hasteLink}.`,
				CATCH: (content: string) => `${PREFIXES.ERROR}Error: ${CODEBLOCK.START('xl')}${content}${CODEBLOCK.END}`,
				HASTE: (error: Error) => `\n• Error during hastebin upload: \`${error}\``
			}
		},
		RELOAD: {
			SUCCESS: {
				RELOAD_ALL: `${PREFIXES.SUCCESS}Reloaded all commands and listeners.`,
				RELOAD_ONE_COMMAND: (commandOrListener: string) => `${PREFIXES.SUCCESS}Reloaded command \`${commandOrListener}\`.`,
				RELOAD_ONE_LISTENER: (commandOrListener: string) => `${PREFIXES.SUCCESS}Reloaded event listener \`${commandOrListener}\`.`
			},
			ERRORS: {
				NO_RELOAD: (error: Error) => `${PREFIXES.ERROR}Could not reload: \`${error}\`.`,
				NO_RELOAD_COMMAND: (error: Error, commandOrListener: string) => `${PREFIXES.ERROR}Could not reload \`${commandOrListener}\`: \`${error}\`.`
			}
		},
		PREFIX: {
			DM_PREFIX: (defaultPrefix: string) => `You can use the standard prefix \`${defaultPrefix}\` in direct messages.`,
			GUILD_PREFIX: (prefix: string) => `My prefix here is \`${prefix}\`.\nAlternatively you can mention me.`,
			SUCCESS: {
				CHANGE: (guild: Guild, oldPrefix: string, newPrefix: string) => `${PREFIXES.SUCCESS}Prefix on \`${guild.name}\` changed from \`${oldPrefix}\` to \`${newPrefix}\`.`,
				RESET: (guild: Guild, defaultPrefix: string) => `${PREFIXES.SUCCESS}PPrefix on \`${guild.name}\` reset to \`${defaultPrefix}\`.`
			}
		},
		DISABLE: {
			SUCCESS: {
				RESET: (location: string) => `${PREFIXES.SUCCESS}Enabled all commands ${location}.`,
				ENABLED: (name: string, location: string, isCommand: boolean) => `${PREFIXES.SUCCESS}Enabled ${isCommand ? 'command' : 'category'} ${name} ${location}`,
				DISABLED: (name: string, location: string, isCommand: boolean) => `${PREFIXES.SUCCESS}Disabled ${isCommand ? 'command' : 'category'} ${name} ${location}`
			},
			ERRORS: {
				OWNER_DISABLED: (name: string, isCommand: boolean) => `${PREFIXES.ERROR}The ${isCommand ? 'command' : 'category'} \`${name}\` ${isCommand ? 'or its category' : ''} is disabled globally by the owner. You can not apply settings for it at this time.`
			}
		},
		HELP: {
			INFO: {
				NAME: (name: string) => `Name: \`${name}}\``,
				CATEGORY: (name: string) => `\nCategory: \`${name}\``,
				ALIASES: (aliases: string[]) => `\nAliases: ${aliases.map(e => `\`${e}\``).join(', ')}`,
				DESCRIPTION: (description: string) => `\nDescription: ${description}`,
				USAGE: (usage: string) => `\nUsage: \`${usage}\``,
				USAGE_FLAG_FORMAT: (flags: string, usage: string) => `${flags}: ${usage}\n`,
				OWNER_ONLY: (isOwner: boolean) => `\n${isOwner ? PREFIXES.GRANTED : PREFIXES.DENIED} Owner only`,
				GUILD_ONLY: (isGuild: boolean) => `\n${isGuild ? PREFIXES.GRANTED : PREFIXES.DENIED} Command can only be used in a guild`,
				USER_PERMISSIONS: (permissions: string, granted: boolean) => `\n${granted ? PREFIXES.GRANTED : PREFIXES.DENIED} User permissions: ${permissions}`,
				BOT_PERMISSIONS: (permissions: string, granted: boolean) => `\n${granted ? PREFIXES.GRANTED : PREFIXES.DENIED} Bot permissions: ${permissions}`,
				BLACKLIST: {
					OWNER: {
						COMMAND: `\n${PREFIXES.NO_ACCESS} Command disabled globally by Owner`,
						CATEGORY: (category: string) => `\n${PREFIXES.NO_ACCESS} Command category \`${category}\` disabled globally by Owner`
					},
					GUILD: {
						COMMAND: `\n${PREFIXES.NO_ACCESS} Command disabled locally on this guild`,
						CATEGORY: (category: string) => `\n${PREFIXES.NO_ACCESS} Command category \`${category}\` disabled locally on this guild`
					}
				}
			},
			OUTPUT: (commandMap: string[], prefix: string, commandName: string) => stripIndents`
			Your available commands are:
			${commandMap.join('\n')}

			You can use \`${prefix}${commandName} <commandname>\` to get more information about a command.`
		},
		VERSION: {
			ERRORS: {
				KEY_NOT_FOUND: `${PREFIXES.ERROR}I could not find a required depdency in the lockfile.`
			}
		},
		TEMPROLE: {
			PROMPT: (role: string, target: string, task: Task) => `There is already a role record for \`${target}\` and \`${role}\` in task \`#${task.id}\` for \`${format(task.timestamp, DATEFORMAT.MINUTE)}\`. Are you sure you want to overwrite? ${SUFFIXES.PROMPT}`,
			DELETE_NOTICE: `* ${COMMANDS.TEMPROLE.DELETE_EMOJI}: role will be deleted when the task expires and the bot has the ability to do so.`,
			ERRORS: {
				INVALID_ROLE_ARGS: (argsstring: string) => `${PREFIXES.ERROR}Can not build a role from \`${argsstring}\`. Please provide the format \`"role Name, color"\`, where \`,\` separates role name and color and the full argument is provided in double quotes \`"\`.`,
				TOO_SHORT: `${PREFIXES.ERROR}Duration must at least be \`${COMMANDS.TEMPROLE.MIN_DURATION_TEXT}\`.`,
				NO_ENTRY: `${PREFIXES.ERROR}Could not created task.`,
				NOT_MANAGEABLE: (role: string) => `${PREFIXES.ERROR}I can not manage the role \`${role}\`.`,
				NO_TASKS: (guildname: string) => `${PREFIXES.ERROR}No executable tasks found for \`${guildname}\``,
				NO_TARGET_TASKS: (username: string) => `${PREFIXES.ERROR}No executable tasks found for user \`${username}\`.`,
				AUTH: `${PREFIXES.ERROR}You are not authorized to assign the targeted role.`
			},
			SUCCESS: (role: string, target: string, task: Task, deleteRole: boolean) => `${PREFIXES.SUCCESS}Granted \`${target}\` the role \`${role}\`, scheduled to be removed \`${format(task.timestamp, DATEFORMAT.MINUTE)} (${TIMEZONE})\`${deleteRole ? COMMANDS.TEMPROLE.DELETE_SUFFIX : ''}`
		},
		TEA: {
			ERRORS: {
				TOO_SHORT: `${PREFIXES.ERROR}Duration must at least be \`${COMMANDS.TEA.MIN_DURATION_TEXT}\`. I'm sure you want *some* flavor in your tea.`,
				TOO_LONG: `${PREFIXES.ERROR}You don't want to let your tea steep that long. The maximum recommended steep time is \`${COMMANDS.TEA.MAX_DURATION_TEXT}\`.`,
				NO_ENTRY: `${PREFIXES.ERROR}Could not created task.`
			},
			SUCCESS: (task: Task) => `${PREFIXES.SUCCESS}I will remind you in \`${formatDistanceToNow(task.timestamp)}\`.`,
			FOOTER: 'your tea is readily steeped and awaits sipping. 🍵',
			QUOTES: [
				'> I say let the world go to hell, but I should always have my tea.\n> ― Fyodor Dostoevsky, Notes from Underground ',
				'> "Take some more tea.\n> - The March Hare to Alice, very earnestly',
				"> Honestly, if you're given the choice between Armageddon or tea, you don't say 'what kind of tea?\n> ― Neil Gaiman ",
				'> Tea ... is a religion of the art of life.\n> ― Kakuzō Okakura, The Book of Tea',
				"> The proper, wise balancing of one's whole life may depend upon the feasibility of a cup of tea at an unusual hour.\n> ― Arnold Bennett, How to Live on 24 Hours a Day",
				'> A simple cup of tea is far from a simple matter.\n> ― Mary Lou Heiss, The Story of Tea: A Cultural History and Drinking Guide ',
				'> With melted snow I boil fragrant tea.\n> ― Mencius, Mencius ',
				'> The spirit of the tea beverage is one of peace, comfort and refinement.\n> ― Arthur Gray, Little Tea Book ',
				'> A man who wishes to make his way in life could do no better than go through the world with a boiling tea-kettle in his hand.\n> - Sydney Smith, A memoir of the Rev. Sydney Smith',
				'> I always fear that creation will expire before teatime.\n> ― Sydney Smith, The Sayings of Sydney Smith ',
				'> [Tea-masters] have given emphasis to our natural love of simplicity, and shown us the beauty of humility. In fact, through their teachings tea has entered the life of the people.\n> ― Kakuzō Okakura, The Book of Tea',
				'> One of the first requisites of a tea-master is the knowledge of how to sweep, clean, and wash, for there is an art in cleaning and dusting.\n> ― Kakuzo Okakura, The Book of Tea'
			]
		},
		MENSA: {
			ERRORS: {
				NO_WEEKDAY: (date: string) => `${PREFIXES.ERROR}No Data for ${date}, Mensa data is only available Mo-Fr.`,
				NO_DATA: (date: string) => `${PREFIXES.ERROR}No data available for ${date} (the date might be too far in the past or future or fall into lecture pauses), please specify another date or offset.`,
				NO_DATA_ALL: `${PREFIXES.ERROR}No future data available.`
			},
			CREDIT: 'Data provided by https://www.mensa-kl.de'
		},
		ROLEINFO: {
			RANDOM_FOOTER: 'I could not resolve your query to a role, so i picked one at random!'
		},
		CHANNELINFO: {
			ERRORS: {
				NO_PERMISSION: (channel: GuildChannel) => `${PREFIXES.ERROR}You don't have permission to view \`${channel.name}\`.`
			}
		},
		USERINFO: {
			RANDOM_FOOTER: 'I could not resolve your query to a user, so here is your information instead!',
			BLACKLIST: {
				BLACKLISTED: `${PREFIXES.NO_ACCESS} Blacklisted`,
				NOT_BLACKLISTED: `Not blacklisted`
			}
		}
	},
	LISTENERS: {
		DISCONNECT: (eventcode: string) => `Disconnect (${eventcode})`,
		READY: (user: ClientUser) => `Logged in as ${user.tag} (${user.id})`,
		RECONNECT: 'Reconnecting...',
		RESUME: (events: any) => `Resumed. (replayed ${events} events)`,
		COMMAND_BLOCKED: {
			ERRORS: {
				GUILD_ONLY: (commandname: string) => `${PREFIXES.ERROR}The command \`${commandname}\` is not available in direct messages.`
			}
		},
		MISSING_PERMISSIONS: {
			ERRORS: {
				USER: (permissions: string[], commandname: string) => `${PREFIXES.ERROR}You need the permission${permissions.length > 1 && 's'} ${permissions} to execute the command \`${commandname}\`.`,
				BOT: (permissions: string[], commandname: string) => `${PREFIXES.ERROR}I need the permission${permissions.length > 1 && 's'} ${permissions} to execute the command \`${commandname}\`.`
			}
		},
		COOLDOWN: {
			ERRORS: {
				TRY_AGAIN_IN: (offset: number) => `${PREFIXES.ERROR}Try again in ${offset}s.`
			}
		},
		MESSAGE_INVALID: {
			ERRORS: {
				NO_CONNECTION: (user: User) => `${PREFIXES.ERROR}[${EMOJIS.AUTH}] Connection to \`${user.tag}\` (${user.id}) could not be established.`,
				NO_RECIPIENT: `${PREFIXES.ERROR}[${EMOJIS.AUTH}] Recipient not found.`,
				MAX_CHANNELS: `${PREFIXES.ERROR}Unfortunately the maximum channel size on the hub server is reached, so I can not create a channel to forward your message. Please try again later.`
			},
			TOPIC: (user: User) => `${EMOJIS.AUTH} DM relay: ${user} | ${user.tag} (${user.id}) Bot: ${user.client.user} | ${user.client.user!.tag} (${user.client.user!.id})`
		}
	}
};
