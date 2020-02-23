import { Command } from 'discord-akairo';
import { Message, Collection } from 'discord.js';
import fetch from 'node-fetch';
import * as qs from 'querystring';
import { CorEmbed } from '../../structures/CorEmbed';
import { COMMANDS, MESSAGES } from '../../util/constants';
import { format, addDays, getDay } from 'date-fns';

interface ApiEntry {
	m_id: string;
	date: string;
	loc: string;
	title: string;
	price: string;
	rating: string;
	rating_amt: string;
	image: string;
	icon: string;
}

interface Dish {
	title: string;
	id: string;
	date: Date;
	loc: string;
	price: number | null;
	rating: number | null;
	rating_count: number | null;
	imageURL: string | null;
	icon: string | null;
	vegetarian: boolean;
	tags: string[];
}

class MensaCommand extends Command {
	private constructor() {
		super('mensa', {
			aliases: ['mensa'],
			description: {
				content: 'Show mensa food, current day if no parameters are given, else day-offset or yyy-mm-dd as date parameter',
				usage: '[yyyy-mm-dd|offset] [--veg] [--all] [--minimal]',
				flags: {
					'`-v`, `--vegetarian`': 'only show vegetarian dishes and buffet',
					'`-a`, `--all`': 'show all future days (sends multiple messages!)',
					'`-m`, `--minimal`': 'hide price and rating'
				}
			},
			args: [
				{
					id: 'date',
					type: (_, str): Date => {
						if (!str) return new Date();
						const reg = new RegExp('/^-?\d+$/');
						const match = reg.exec(str);
						if (match) {
							return addDays(new Date(), parseInt(match[0], 10));
						}

						const date = new Date(str);
						if (isNaN((date as any as number))) {
							return new Date();
						}
						return date;
					}
				},
				{
					id: 'veg',
					match: 'flag',
					flag: ['-v', '--vegetarian']
				},
				{
					id: 'all',
					match: 'flag',
					flag: ['-a', '--all']
				},
				{
					id: 'mini',
					match: 'flag',
					flag: ['-m', '--minimal']
				}
			],
			cooldown: 20000,
			ratelimit: 1,
			editable: true,
			clientPermissions: ['EMBED_LINKS', 'SEND_MESSAGES']
		});
	}

	public dishEmbed(dishes: Dish[], veg = false, mini = false): CorEmbed {
		const e = new CorEmbed()
			.setTitle(`${format(dishes[0].date, COMMANDS.MENSA.DATEFORMAT)}${veg ? ` (vegetarisch) ${COMMANDS.MENSA.EMOJIS.VEG}` : ''}`)
			.setFooter(MESSAGES.COMMANDS.MENSA.CREDIT);
		for (const dish of dishes) {
			let string = '';
			const title = dish.loc === 'Atrium'
				? `• ${dish.title.split(',')
					.filter(element => ['vegan', 'vegetarisch'].some(s => element.toLowerCase().includes(s)))
					.join('\n•')}`
				: dish.title;
			string += `${title}${mini ? '' : '\n'}`;
			if (dish.price && !mini) {
				string += `\nPrice: \`${dish.price}${COMMANDS.MENSA.CURRENCY_SYMBOL}\``;
			}
			if (dish.rating_count && !mini) {
				const rate = COMMANDS.MENSA.EMOJIS.RATING.repeat(Math.floor(dish.rating!)).padEnd(COMMANDS.MENSA.RATING_MAX, '\u2003');
				string += `\nRating: \`${rate}\`\nVotes: ${dish.rating_count}`;
			}
			if (!veg || (veg && (dish.vegetarian || dish.loc === 'Buffet'))) {
				e.addField(dish.loc, string, true);
			}
		}
		if (veg) {
			e.setColor(COMMANDS.MENSA.COLORS.VEG);
		}
		return e;
	}

	public parseAPIData(data: ApiEntry[]): Dish[] {
		return data.map((entry: ApiEntry): Dish => {
			const vegRegex = /(?<loc>.+)(?<veg>veg$)/;
			const noVegRegex = /(?<loc>.+)/;
			let match = vegRegex.exec(entry.loc);
			if (!match) {
				match = noVegRegex.exec(entry.loc);
			}
			const groups = match!.groups!;
			const loc = groups.loc!;
			const vegetarian = groups.veg || entry.title.toLowerCase().includes('vegan') || entry.icon === 'veg' ? true : false;
			return {
				id: entry.m_id,
				date: new Date(entry.date),
				loc: isNaN(parseInt(loc, 10)) ? loc : `Ausgabe ${loc}${vegetarian ? ' (vegetarisch)' : ''}`,
				title: entry.title.trim(),
				price: parseFloat(entry.price) || null,
				rating: parseFloat(entry.rating) || null,
				rating_count: parseInt(entry.rating_amt, 10),
				imageURL: entry.image ? `${COMMANDS.MENSA.API.IMAGE_BASE_URL}/${entry.image}` : null,
				icon: entry.icon || null,
				vegetarian,
				tags: []
			};
		});
	}

	public async exec(message: Message, { date, veg, all, mini }: {date: Date; veg: boolean; all: boolean; mini: boolean}): Promise<Message | Message[]> {
		const weekday = getDay(date);
		const dateString = format(date, COMMANDS.MENSA.DATEFORMAT);
		if (!all && [6, 0].includes(weekday)) {
			return message.util!.send((MESSAGES.COMMANDS.MENSA.ERRORS.NO_WEEKDAY(dateString)));
		}
		const queryString = qs.stringify({ format: 'json', date: all ? 'all' : format(date, COMMANDS.MENSA.DATE_ISO) });
		const headers = {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:27.0) 	Gecko/20100101 Firefox/27.0'
		};
		const res = await fetch(`${COMMANDS.MENSA.API.API_BASE_URL}?${queryString}`, { headers });
		try {
			const json = await res.json();
			const data = this.parseAPIData(json);
			if (all) {
				const filtered: Collection<number, Dish[]> = new Collection();
				for (const entry of data) {
					const day = getDay(entry.date);
					if (!filtered.get(day)) {
						filtered.set(day, []);
					}
					filtered.get(day)!.push(entry);
				}
				if (!filtered.size) {
					return message.channel.send(MESSAGES.COMMANDS.MENSA.ERRORS.NO_DATA_ALL);
				}
				const messages = [];
				for (const dishes of filtered.values()) {
					messages.push(await message.channel.send(this.dishEmbed(dishes, veg, mini)));
				}
				return messages;
			}
			return message.util!.send(this.dishEmbed(data, veg, mini));
		} catch (_) {
			return message.util!.send(MESSAGES.COMMANDS.MENSA.ERRORS.NO_DATA(dateString));
		}
	}
}
export default MensaCommand;
