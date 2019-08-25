import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { crcRemainder, checkBit, checkGenerator } from '../../util/crcUtil';
import { stripIndents } from 'common-tags';

const cbStartJS = '```js\n';
const cbEnd = '\n```';
const explanation = `The **C**yclic **R**edundancy **C**heck is a method to find bit errors during transmission of data packets. CRC uses standardized polynomials as generators that are known by both the sending as well as the receiving party. The senders goal is to find \`generator length - 1\` checksum bits that, appended to the original data and XORed with the generator result in no remainder. To compute this value a padding of \`generator length - 1\` filler bits is appended to the data and the resulting padded bit sequence is XORed with the generator sequence.`;

class CRCCreateCommand extends Command {
	private constructor() {
		super('crc-create', {
			aliases: ['crc-c', 'crc-create', 'crc-compute', 'crc-checksum'],
			description: {
				content: 'Computes Cyclic Redundancy Check checksum (`--explain` to display an explanation for CRC, `--computation` to include the computation table in the response)',
				usage: '<bitstring content> <bitstring generator> [--explain] [--computation]'
			},
			cooldown: 5000,
			ratelimit: 2,
			clientPermissions: ['ATTACH_FILES'],
			args: [
				{
					id: 'content',
					type: 'lowercase'
				},
				{
					id: 'generator',
					type: 'lowercase'
				},
				{
					id: 'explain',
					match: 'flag',
					flag: ['--explanation', '--explain', '-e']
				},
				{
					id: 'computation',
					match: 'flag',
					flag: ['--computation', '--compute', '-c']
				}
			]
		});
	}

	public async exec(message: Message, { content, generator, explain, computation }: {content: string; generator: string; explain: boolean; computation: boolean}): Promise<Message | Message[]> {
		if (!checkBit(content)) {
			return message.util!.send(`✘ Invalid bitstring \`${content}\`.`);
		}
		if (!checkBit(generator)) {
			return message.util!.send(`✘ Invlaid generator bitstring \`${generator}\`.`);
		}
		if (!checkGenerator(generator)) {
			return message.util!.send(`✘ Invlaid generator bitstring \`${generator}\`. The most significant (leftmost) bit is required to be a 1`);
		}
		const { crc, steps } = crcRemainder(content, generator, '0');
		const computationCodeblock = `${cbStartJS}${steps.join('\n').replace(/ /g, '\u200B ')}${cbEnd}`;
		const ceillLenght = computationCodeblock.length + explanation.length + 3;
		if (computation && ceillLenght > 2000) {
			const messageContent = stripIndents` 
				${explain ? explanation : ''}
				✓ Computed CRC bits: \`${crc}\`
			`;
			const attachText = stripIndents`
				Data: ${content}
				Generator: ${generator}
				CRC-Checksum: ${crc}
				Explanation: ${explanation.replace(/\*\*/g, '').replace(/`/g, '').replace(/\./g, '.\n')}
				Computation:
				${steps.join('\n').replace(/ /g, '\u200B ')}
			`;
			return message.util!.send(`${messageContent}`, { files: [{ attachment: Buffer.from(attachText.replace(/\n/g, '\r\n'), 'utf8'), name: 'crc_computation.txt' }] });
		}
		return message.util!.send(stripIndents`
			${explain ? explanation : ''}
			${computation ? computationCodeblock : ''}
			✓ Computed CRC bits: \`${crc}\`
			`);
	}
}
export default CRCCreateCommand;
