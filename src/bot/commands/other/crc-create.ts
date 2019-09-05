import { Command } from 'discord-akairo';
import { Message, MessageAttachment } from 'discord.js';
import { crcRemainder, checkBit, checkGenerator, toBinary } from '../../util/crcUtil';
import { stripIndents } from 'common-tags';
import { CorEmbed } from '../../structures/CorEmbed';

const cbStartJS = '```js\n';
const cbEnd = '\n```';
const explanation = stripIndents`The **C**yclic **R**edundancy **C**heck is a method to find bit errors during transmission of data packets.

	CRC uses standardized polynomials as generators that are known by both the sending as well as the receiving party.
	The senders goal is to find \`generator length - 1\` checksum bits that, appended to the original data and XORed with the generator result in no remainder.

	To compute this value a padding of \`generator length - 1\` filler bits is appended to the data and the resulting padded bit sequence is XORed with the generator sequence.
`;

class CRCCreateCommand extends Command {
	private constructor() {
		super('crc-create', {
			aliases: ['crc', 'crc-create', 'crc-compute', 'crc-c', 'crc-checksum'],
			description: {
				content: 'Computes Cyclic Redundancy Check checksum (`--verbose` to include the computation table in the response)',
				usage: '<content> <bitstring generator> [--verbose]'
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
					id: 'verbose',
					match: 'flag',
					flag: ['--verbose', '-v']
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
			return message.util!.send(`✘ Invalid generator bitstring \`${generator}\`. The generator must consist of only \`0\` and \`1\``);
		}
		if (!checkGenerator(generator)) {
			return message.util!.send(`✘ Invlaid generator bitstring \`${generator}\`. The most significant (leftmost) bit is required to be a \`1\``);
		}
		const { crc, steps } = crcRemainder(binaryContent, generator, '0');
		const computationCodeblock = `${cbStartJS}${steps.join('\n').replace(/ /g, '\u200B ')}${cbEnd}`;
		const ceillLenght = computationCodeblock.length + explanation.length + 3;

		const embed = new CorEmbed().setTitle('Cyclic Redundancy Check')
			.addField('Input', content);

		if (verbose && content !== binaryContent) {
			embed.addField('Binary Data', binaryContent);
		}
		embed.addField('Provided generator', `\`${generator}\``, true)
			.addField('Computed checksum', `\`${crc}\``, true)
			.setFooter(`You can check the validity of a string with: ${prefix} ${crcCheck!.id} ${crcCheck!.description!.usage}`);

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
					VERBOSE: ${verbose ? 'TRUE' : 'FALSE'}
					${steps.join('\n').replace(/ /g, '\u200B ')}
				`;
				return message.util!.send([embed.applySpacers().shorten(), new MessageAttachment(Buffer.from(attachText.replace(/\n/g, '\r\n'), 'utf8'), 'crc_computation.txt')]);
			}
		}
		return message.util!.send(verbose ? computationCodeblock : '', embed.applySpacers().shorten());
	}
}
export default CRCCreateCommand;
