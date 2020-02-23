import { Command } from 'discord-akairo';
import { Message, MessageAttachment } from 'discord.js';
import { crcRemainder, checkBit, checkGenerator, toBinary } from '../../util/crcUtil';
import { stripIndents } from 'common-tags';
import { CorEmbed } from '../../structures/CorEmbed';
import { CODEBLOCK, MESSAGES } from '../../util/constants';

class CRCCreateCommand extends Command {
	private constructor() {
		super('crc-create', {
			aliases: ['crc', 'crc-create', 'crc-c'],
			description: {
				content: 'Computes Cyclic Redundancy Check checksum',
				usage: '<content> <bitstring generator> [--verbose]',
				flags: {
					'`-v`, `--verbose`': 'include the computation table'
				}
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['ATTACH_FILES', 'EMBED_LINKS', 'SEND_MESSAGES'],
			args: [
				{
					id: 'content',
					type: 'text'
				},
				{
					id: 'generator',
					type: 'lowercase'
				},
				{
					id: 'verbose',
					match: 'flag',
					flag: ['-v', '--verbose']
				}
			]
		});
	}

	public async exec(message: Message, { content, generator, verbose }: {content: string; generator: string; verbose: boolean}): Promise<Message | Message[]> {
		// @ts-ignore
		const prefix = this.handler.prefix(message);
		const crcCheck = this.handler.modules.get('crc-check');
		const binaryContent = checkBit(content) ? content : toBinary(content);
		if (!checkBit(generator)) {
			return message.util!.send(MESSAGES.COMMANDS.CRC.ERRORS.GENERATOR_ONLY_BINARY(generator));
		}
		if (!checkGenerator(generator)) {
			return message.util!.send(MESSAGES.COMMANDS.CRC.ERRORS.GENERATOR_LEFTMOST_BIT);
		}
		const { crc, steps } = crcRemainder(binaryContent, generator, '0');
		const computationCodeblock = `${CODEBLOCK.START('js')}${steps.join('\n').replace(/ /g, '\u200B ')}${CODEBLOCK.END}`;
		const ceillLenght = computationCodeblock.length + MESSAGES.COMMANDS.CRC.EXPLANATIONS.CREATE.length + 3;

		const embed = new CorEmbed().setTitle('Cyclic Redundancy Check')
			.addFields({ name: 'Input', value: content });

		if (verbose && content !== binaryContent) {
			embed.addFields({ name: 'Binary Data', value: binaryContent });
		}
		embed
			.addFields(
				{ name: 'Provided generator', value: `\`${generator}\``, inline: true },
				{ name: 'Computed checksum', value: `\`${crc}\``, inline: true }
			)
			.setFooter(`You can check the validity of a string with: ${prefix} ${crcCheck!.id} ${crcCheck!.description.usage}`);

		if (verbose) {
			embed.setDescription(MESSAGES.COMMANDS.CRC.EXPLANATIONS.CREATE);
			if (ceillLenght > 2000) {
				if (ceillLenght > 2000000) {
					embed.addFields({ name: MESSAGES.COMMANDS.CRC.WARNINGS.TITLE, value: MESSAGES.COMMANDS.CRC.WARNINGS.ENTITY_TOO_LARGE });
					return message.util!.send(embed.shorten());
				}
				const attachText = stripIndents`
					INPUT: ${content}
					BINARY_DATA: ${binaryContent}
					GENERATOR: ${generator}
					CHECKSUM: ${crc}
					VERBOSE: ${verbose ? 'TRUE' : 'FALSE'}
					${steps.join('\n').replace(/ /g, '\u200B ')}
				`;
				return message.util!.send([embed.shorten(), new MessageAttachment(Buffer.from(attachText.replace(/\n/g, '\r\n'), 'utf8'), 'crc_computation.txt')]);
			}
		}
		return message.util!.send(verbose ? computationCodeblock : '', embed.shorten());
	}
}
export default CRCCreateCommand;
