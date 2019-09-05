import { Command } from 'discord-akairo';
import { Message, MessageAttachment } from 'discord.js';
import { crcCheck, checkBit, checkGenerator, checkCRC, toBinary } from '../../util/crcUtil';
import { stripIndents } from 'common-tags';
import { CorEmbed } from '../../structures/CorEmbed';

const cbStartJS = '```js\n';
const cbEnd = '\n```';
const explanation = stripIndents`The **C**yclic **R**edundancy **C**heck can detect all bit errors in bursts of at most the checksum length.

	If the generator is chosen well (for example according to standards) it can also detect all odd numbers of bit errors as well as even numbers of bit errors with a probability of 1 - 0.5^checksum length.
`;

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
			return message.util!.send(`✘ Invalid generator bitstring \`${generator}\`. The generator must consist of only \`0\` and \`1\``);
		}
		if (!checkGenerator(generator)) {
			return message.util!.send(`✘ Invalid generator bitstring \`${generator}\`. The most significant (leftmost) bit is required to be a \`1\``);
		}
		if (!checkBit(crc)) {
			return message.util!.send(`✘ Invalid CRC checksum \`${crc}\`.`);
		}
		if (!checkCRC(crc, generator)) {
			return message.util!.send(`✘ Invalid CRC checksum \`${generator}\`. The checksum has the length \`generator length - 1\``);
		}

		const { check, steps } = crcCheck(binaryContent, generator, crc);
		const computationCodeblock = `${cbStartJS}${steps.join('\n').replace(/ /g, '\u200B ')}${cbEnd}`;
		const ceillLenght = computationCodeblock.length + explanation.length + 3;

		const embed = new CorEmbed().setTitle('Cyclic Redundancy Check')
			.addField('Input', content);

		embed.addField('Provided generator', `\`${generator}\``, true)
			.addField('Provided checksum', `\`${crc}\``, true)
			.addField(`CRC-check`, `${check ? '✓ passed' : '✘ failed'}`, true)
			.setColor(check ? '#03b581' : '#d04949 ');

		if (verbose) {
			embed.setDescription(explanation);
			if (ceillLenght > 2000) {
				if (ceillLenght > 2000000) {
					embed.addField('[WARNING] Can not attach file', '✘ Request entity too large to upload steps');
					return message.util!.send(embed.applySpacers().shorten());
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
				return message.util!.send([embed.applySpacers().shorten(), new MessageAttachment(Buffer.from(attachText.replace(/\n/g, '\r\n'), 'utf8'), 'crc_check.txt')]);
			}
		}
		return message.util!.send(verbose ? computationCodeblock : '', embed.applySpacers().shorten());
	}
}
export default CRCCheckCommand;
