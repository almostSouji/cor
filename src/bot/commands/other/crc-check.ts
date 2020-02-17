import { Command } from 'discord-akairo';
import { Message, MessageAttachment } from 'discord.js';
import { crcCheck, checkBit, checkGenerator, checkCRC, toBinary } from '../../util/crcUtil';
import { stripIndents } from 'common-tags';
import { CorEmbed } from '../../structures/CorEmbed';
import { CODEBLOCK, COMMANDS, MESSAGES } from '../../util/constants';

class CRCCheckCommand extends Command {
	private constructor() {
		super('crc-check', {
			aliases: ['crc-check', 'crc-verify', 'crc-v'],
			description: {
				content: 'Cyclic Redundancy Check (`--verbose` to include the computation table in the response)',
				usage: '<content> <bitstring generator> <crc bits> [--verbose]'
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['ATTACH_FILES', 'EMBED_LINKS'],
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
					id: 'crc',
					type: 'lowercase'
				},
				{
					id: 'verbose',
					match: 'flag',
					flag: ['--verbose', '-v']
				}
			]
		});
	}


	public async exec(message: Message, { content, generator, crc, verbose }: {content: string; generator: string; crc: string; verbose: boolean}): Promise<Message | Message[]> {
		const binaryContent = checkBit(content) ? content : toBinary(content);
		if (!checkBit(generator)) {
			return message.util!.send(MESSAGES.COMMANDS.CRC.ERRORS.GENERATOR_ONLY_BINARY(generator));
		}
		if (!checkGenerator(generator)) {
			return message.util!.send(MESSAGES.COMMANDS.CRC.ERRORS.GENERATOR_LEFTMOST_BIT(generator));
		}
		if (!checkBit(crc)) {
			return message.util!.send(MESSAGES.COMMANDS.CRC.ERRORS.INVALID_CHECKSUM(crc));
		}
		if (!checkCRC(crc, generator)) {
			return message.util!.send(MESSAGES.COMMANDS.CRC.ERRORS.CHECKSUM_LENGTH(crc));
		}

		const { check, steps } = crcCheck(binaryContent, generator, crc);
		const computationCodeblock = `${CODEBLOCK.START('js')}${steps.join('\n').replace(/ /g, '\u200B ')}${CODEBLOCK.END}`;
		const ceillLenght = computationCodeblock.length + MESSAGES.COMMANDS.CRC.EXPLANATIONS.CHECK.length + 3;

		const embed = new CorEmbed().setTitle('Cyclic Redundancy Check')
			.addField('Input', content)
			.addField('Provided generator', `\`${generator}\``, true)
			.addField('Provided checksum', `\`${crc}\``, true)
			.addField(`CRC-check`, `${check ? MESSAGES.COMMANDS.CRC.CHECK_PASSED : MESSAGES.COMMANDS.CRC.CHECK_FAILED}`, true)
			.setColor(check ? COMMANDS.CRC.COLORS.SUCCESS : COMMANDS.CRC.COLORS.FAIL);

		if (verbose) {
			embed.setDescription(MESSAGES.COMMANDS.CRC.EXPLANATIONS.CHECK);
			if (ceillLenght > 2000) {
				if (ceillLenght > 2000000) {
					embed.addField(MESSAGES.COMMANDS.CRC.WARNINGS.TITLE, MESSAGES.COMMANDS.CRC.WARNINGS.ENTITY_TOO_LARGE);
					return message.util!.send(embed.shorten());
				}
				const attachText = stripIndents`
					INPUT: ${content}
					BINARY_DATA: ${binaryContent}
					GENERATOR: ${generator}
					CHECKSUM: ${crc}
					CHECK_PASSED: ${check ? 'TRUE' : 'FALSE'}
					VERBOSE: ${verbose ? 'TRUE' : 'FALSE'}
					${steps.join('\n').replace(/ /g, '\u200B ')}
				`;
				return message.util!.send([embed.shorten(), new MessageAttachment(Buffer.from(attachText.replace(/\n/g, '\r\n'), 'utf8'), 'crc_check.txt')]);
			}
		}
		return message.util!.send(verbose ? computationCodeblock : '', embed.shorten());
	}
}
export default CRCCheckCommand;
