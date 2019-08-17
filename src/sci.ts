import fetch from 'node-fetch';
import { load } from 'cheerio';

async function getValidURLS(): Promise<string[]> {
	const urls = [];
	const res = await fetch('https://whereisscihub.now.sh/');
	const cheer = load(await res.text());
	const lead = cheer('.content p strong a').attr('href');
	urls.push(lead);
	const other = cheer('.content aside ul li')
		.find('a')
		.toArray()
		.map(e => e.attribs.href);
	return urls.concat(other);
}

async function main(): Promise<void> {
	const vals = await getValidURLS();
	console.log('--- RESULTS: ---------------------------');
	console.log(vals.map(u => `<${u}>`));
}

main();
