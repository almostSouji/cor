/**
 * Strips the provided string from provided characters until a not provided character is encountered
 * @param input String to strip
 * @param stripChars String of characters to strip
 * @returns Stripped string
 */
const lstrip = (input: string, stripChars: string): string => {
	while (stripChars.includes(input[0])) {
		input = input.slice(1);
	}
	return input;
};

/**
 * Prettifies bitstring with a spacer before the crc
 * @param line Bitstring to prettify
 * @param crcLength Length of the crc that should be spaced
 * @returns Prettified string
 */
const prettify = (line: string, crcLength: number): string => {
	const before = line.slice(0, -1 * (crcLength));
	const after = line.slice(-1 * (crcLength));
	return `${before} ${after}`;
};

/**
 * @param input Bit string input
 * @param polynomial Bit string polynomial (generator)
 * @param initialfiller '0' or '1'
 * @returns An object with calculated crc string and steps
 */
const crcRemainder = (input: string, polynomial: string, initialfiller: string): { crc: string; steps: string[]} => {
	const steps = [];
	polynomial = lstrip(polynomial, '0');
	const inputLength = input.length;
	const crcLength = polynomial.length - 1;
	const initPadding = initialfiller.repeat(crcLength);
	const inputPadded = input + initPadding;
	const inputPaddedArray = inputPadded.split('');
	let curShift = inputPaddedArray.indexOf('1');
	while (inputPaddedArray.slice(0, inputLength).includes('1')) {
		steps.push(prettify(inputPaddedArray.join(''), crcLength));
		steps.push(prettify((' '.repeat(curShift) + polynomial).padEnd(inputPadded.length, ' '), crcLength));
		for (const i of [...Array(polynomial.length).keys()]) {
			inputPaddedArray[curShift + i] = polynomial[i] === inputPaddedArray[curShift + i] ? '0' : '1';
		}
		curShift = inputPaddedArray.indexOf('1');
	}
	steps.push('-'.repeat(inputPaddedArray.length + 1));
	steps.push(prettify(inputPaddedArray.join(''), crcLength));
	const crc = inputPaddedArray.slice(inputLength).join('');

	return { crc, steps };
};

/**
* Checks the integrity of the provided content with the provided polynomial and crc bits
* @param input Bit string input
* @param polynomial Bit string polynomial (generator)
* @param checkValue CRC bit string to check against
* @returns An object with check indeicator and steps
*/
const crcCheck = (input: string, polynomial: string, checkValue: string): { check: boolean; steps: string[]} => {
	const steps = [];
	polynomial = lstrip(polynomial, '0');
	const crcLength = checkValue.length;
	const inputLength = input.length;
	const initPadding = checkValue;
	const inputPadded = input + initPadding;
	const inputPaddedArray = inputPadded.split('');
	let curShift = inputPaddedArray.indexOf('1');
	while (inputPaddedArray.slice(0, inputLength).includes('1')) {
		steps.push(prettify(inputPaddedArray.join(''), crcLength));
		steps.push(prettify((' '.repeat(curShift) + polynomial).padEnd(inputPadded.length, ' '), crcLength));
		for (const i of [...Array(polynomial.length).keys()]) {
			inputPaddedArray[curShift + i] = polynomial[i] === inputPaddedArray[curShift + i] ? '0' : '1';
		}
		curShift = inputPaddedArray.indexOf('1');
	}
	steps.push('-'.repeat(inputPaddedArray.length + 1));
	steps.push(prettify(inputPaddedArray.join(''), crcLength));
	const check = !inputPaddedArray.join('').includes('1');
	return { check, steps };
};

const checkBit = (input: string): boolean => input.split('').filter(c => ['0', '1'].includes(c)).length === input.length;

const checkGenerator = (input: string): boolean => Boolean(input.length) && input[0] === '1';

const checkCRC = (input: string, generator: string): boolean => generator.length - input.length === 1;

export { lstrip, prettify, crcRemainder, crcCheck, checkBit, checkGenerator, checkCRC };
