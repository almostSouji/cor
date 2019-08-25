import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { crcCheck, checkBit, checkGenerator, checkCRC } from '../../util/crcUtil';
import { stripIndents } from 'common-tags';

const cbStartJS = '```js\n';
const cbEnd = '\n```';
const explanation = `The **C**yclic **R**edundancy **C**heck can detect all bit errors in bursts of at most the checksum length. If the generator is chosen well (for example according to standards) it can also detect all odd numbers of bit errors as well as even numbers of bit errors with a probability of 1 - 0.5^checksum length.`;

class CRCCheckCommand extends Command {
	private constructor() {
		super('crc-check', {
			aliases: ['crc-check', 'crc-verify', 'crc-v'],
			description: {
				content: 'Cyclic Redundancy Check (`--computation` to include the computation table in the response)',
				usage: '<bitstring content> <bitstring generator> <crc bits> [--computation]'
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
					id: 'crc',
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


	public async exec(message: Message, { content, generator, crc, explain, computation }: {content: string; generator: string; crc: string; explain: boolean; computation: boolean}): Promise<Message | Message[]> {
		if (!checkBit(content)) {
			return message.util!.send(`✘ Invalid bitstring \`${content}\`.`);
		}
		if (!checkBit(generator)) {
			return message.util!.send(`✘ Invlaid generator bitstring \`${generator}\`.`);
		}
		if (!checkGenerator(generator)) {
			return message.util!.send(`✘ Invlaid generator bitstring \`${generator}\`. The most significant (leftmost) bit is required to be a 1`);
		}
		if (!checkBit(crc)) {
			return message.util!.send(`✘ Invlaid CRC checksum \`${crc}\`.`);
		}
		if (!checkCRC(crc, generator)) {
			return message.util!.send(`✘ Invlaid CRC checksum \`${generator}\`. The checksum has the length \`generator length - 1\``);
		}

		const { check, steps } = crcCheck(content, generator, crc);
		const computationCodeblock = `${cbStartJS}${steps.join('\n').replace(/ /g, '\u200B ')}${cbEnd}`;
		const ceillLenght = computationCodeblock.length + explanation.length + 3;
		if (computation && ceillLenght > 2000) {
			const messageContent = stripIndents`
				${explain ? explanation : ''}
				${check ? '✓ CRC-Check passed' : '✘ CRC-Check failed'}
			`;
			const attachText = stripIndents`
				Data: ${content}
				Generator: ${generator}
				CRC-Checksum: ${crc}
				Check: ${check ? 'passed' : 'failed'}
				Explanation: ${explanation.replace(/\*\*/g, '').replace(/`/g, '').replace(/\./g, '.\n')}
				Computation:
				${steps.join('\n').replace(/ /g, '\u200B ')}
			`;
			return message.util!.send(`${messageContent}`, { files: [{ attachment: Buffer.from(attachText.replace(/\n/g, '\r\n'), 'utf8'), name: 'crc_check.txt' }] });
		}
		return message.util!.send(stripIndents`
			${explain ? explanation : ''}
			${computation ? computationCodeblock : ''}
			${check ? '✓ CRC-Check passed' : '✘ CRC-Check failed'}
			`);
	}
}
export default CRCCheckCommand;
