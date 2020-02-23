import { Guild, Collection, Client, PresenceStatus } from 'discord.js'; // eslint-disable-line
import fetch from 'node-fetch';
import { CorClient } from '../client/CorClient';
import { MESSAGES, UTIL } from '../util/constants';


/**
 * Returns the first key in the provided object where the value satisfies the provided predicate
 * @param {Object} object // Object to check on
 * @param {Function} predicate // Function to check values against
 * @returns {string} Key
 */
const getKeyByValue = (object: Record<string, any>, predicate: Function): string | undefined => Object.keys(object).find(key => predicate(object[key]));
/**
* Returns the status emoji for provided member, results in an alternative if the bot does not have emoji permissions
* @param {client} client Bot client
* @param {string} status Status to get the emoji or altternative for
* @param {Guild} guild Guild to take permission information from
* @returns {string} Emojistring
*/
const displayStatus = (client: CorClient, status: PresenceStatus, guild: Guild | null): string => {
	if (guild && !guild.me!.hasPermission('USE_EXTERNAL_EMOJIS')) {
		return `${status}:`;
	}
	return client.config.emojis[status];
};

/**
* Titlecases provided string
* @param {string} input string to title case
* @returns {string} string in title case
*/
const toTitleCase = (input: string): string => input = input.replace(/(\w)(\w*\s?)/gi, (_: string, p1: string, p2: string): string => p1.toUpperCase() + p2);

/**
* Groups an iterable into a collection based on the return value of provided function
* @param {Collection} collection Collection to group
* @param {Function} fn Function to group by
* @returns {Collection} Grouped Collection
*/
const groupBy = <K, V, G>(collection: Collection<K, V>, fn: (param: V) => G): Collection<G, Collection<K, V>> => {
	const collector: Collection<G, Collection<K, V>> = new Collection();
	for (const [key, val] of collection) {
		const group = fn(val);
		const existing = collector.get(group);
		if (existing) existing.set(key, val);
		else collector.set(group, new Collection([[key, val]]));
	}
	return collector;
};

/**
* Post a string to paste.nomsy.net
* @param {string} code String to post
* @param {string} lang Code language to use
* @returns {string} Link to the paste
*/
const postHaste = async (code: string, lang = ''): Promise<string> => {
	try {
		if (code.length > 400000) {
			return MESSAGES.UTIL.ERRORS.MAX_LENGTH;
		}
		const res = await fetch(`${UTIL.HASTEBIN.PASTE_API_BASE_URL}/documents`, { method: 'POST', body: code });
		const { key, message } = await res.json();
		if (!key) {
			return message;
		}
		return `${UTIL.HASTEBIN.PASTE_API_BASE_URL}/${key}${lang && `.${lang}`}`;
	} catch (err) {
		throw err;
	}
};

/**
* Divide array into chunks
* @param {Array} list Array to devide into chunks
* @param {int} chunksize Elements per chunk
* @returns {Array} Array of chunks
*/
const chunkArray = <T>(list: T[], chunksize: number): T[][] => new Array(Math.ceil(list.length / chunksize)).fill(undefined).map(() => list.splice(0, chunksize));

/**
 * Shorten text with ellipsis (returns input if short enough)
 * @param {string} text Text to shorten
 * @param {number} length Length to shorten to (without ellipsis)
 * @returns {string} Shortened text
 */
const ellipsis = (text: string, length: number): string => {
	if (text.length > length) {
		return `${text.slice(0, length - 3)}...`;
	}
	return text;
};

export { getKeyByValue, displayStatus, groupBy, postHaste, toTitleCase, chunkArray, ellipsis };

