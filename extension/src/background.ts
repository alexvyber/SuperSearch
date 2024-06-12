// TODO Split code into separate files

// chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
//   suggest([
//     { content: text + " one", description: "the first one" },
//     { content: text + " number two", description: "the second entry" },
//   ]);
// });

type ConfigObject = {
	termsDelimiter: string;
	optionsStarter: string;
};

const configs: ConfigObject = {
	termsDelimiter: "/",
	optionsStarter: "-",
};

/* Parsing helper functions
 */
const parseEngineAbbr = (input: string): string => {
	const engineAbbr = input.split(" ")[0];
	return engineAbbr;
};

const parseOptions = (input: string): string[] => {
	const spacesRemoved = input.replace(/\s+/g, " ").trim();
	const [, ...options] = spacesRemoved
		.split(configs.termsDelimiter)[0] // TODO delimiter should be accepted as a parameter
		.trim()
		.split(" ");
	return options;
};

const parseTerms = (input: string): string => {
	// TODO delimiter should be accepted as a parameter
	const terms = input.split(configs.termsDelimiter)[1].trim();
	return terms;
};
/* End Parsing helper functions
 */

type Option = [string, { name: string; optUrl: string }];

type SearchEngine = {
	id: number;
	abbr: string;
	name: string;
	baseUrl: string;
	defaultSearchUrl: string;
	options: Option[];
};

const getDefaultEngine = (): SearchEngine =>
	searchEngines.find(({ id }) => id === 1) || searchEngines[0];

// Search Engines Object
// TODO It has to be provided by API
// TODO and stored in local memory
const searchEngines: SearchEngine[] = [
	{
		id: 1,
		abbr: "go",
		name: "google",
		baseUrl: "https://google.com",
		defaultSearchUrl: "https://google.com/search?q=",
		options: [
			["default", { name: "search", optUrl: "search?q=" }],
			["i", { name: "images", optUrl: "search?tbm=isch&q=" }],
		],
	},
	{
		id: 2,
		abbr: "gh",
		name: "github",
		baseUrl: "https://github.com",
		defaultSearchUrl: "https://github.com/search?q=",
		options: [
			["default", { name: "search", optUrl: "search?q=" }],
			["i", { name: "images", optUrl: "/search?q=" }],
			["a", { name: "images", optUrl: "/search?q=" }],
		],
	},
];

// Return engine object
const getEngine = (engineAbbr: string): SearchEngine => {
	const engine =
		searchEngines.find(({ abbr }) => {
			return abbr === engineAbbr;
		}) || getDefaultEngine();

	return engine;
};

type EngineMap = Map<string, { name: string; optUrl: string }>;

// Return search options for given search object
const getEngineOptions = (
	engine: SearchEngine,
	options: string[],
): string[] => {
	const urls: string[] = [];
	const enginesMap: EngineMap = new Map(engine.options);
	options.forEach((option) => {
		if (enginesMap.has(option)) {
			const optUrl: string | undefined = enginesMap.get(option)?.optUrl;
			if (optUrl !== undefined) {
				urls.push(engine.baseUrl + "/" + optUrl);
			}
		}
	});

	// If no option matched then return default engines search url
	if (urls.length === 0) {
		urls.push(engine.defaultSearchUrl);
		return urls;
	} else {
		return urls;
	}
};

// If we don't have any engines provided, we need default one
const getDefaultUrl = () => "https://google.com/search?q=";

// takes input
// Works only for one seaarch engine
// Generate multiple urls for one search engine
// Spawns new tab with each generated url
// TODO Make possible multiple engines with multiple options
// TODO Make possible for options to hava parametrs like `-o=something`
const handleInputEntered = (input: string): void => {
	// Trim trimmed input... Just in case =))
	const cleared = input.trim();

	// Take search engine abbreviation
	const engineAbbr = parseEngineAbbr(cleared);

	// Options
	const options = parseOptions(cleared);

	// Search terms
	const terms = parseTerms(cleared);

	// Getting Engine
	const engine = getEngine(engineAbbr);

	// If no options provided we're using default for specified engine
	if (options.length === 0) {
		const url: string = engine.defaultSearchUrl || getDefaultUrl();
		// Encode user input for special characters , / ? : @ & = + $ #
		const newUrl: string = url + encodeURIComponent(terms);
		chrome.tabs.create({ url: newUrl });
	} else {
		// If options were provided then we trying to retrive urls for given options
		// If no option match with engins option then default search url will be returned
		const searchUrls = getEngineOptions(engine, options);

		// We allways have at lesat one url to itterate over it
		searchUrls.map((url) => {
			// Encode user input for special characters , / ? : @ & = + $ #
			const newUrl: string = url + encodeURIComponent(terms);
			chrome.tabs.create({ url: newUrl });
		});
	}
};

chrome.omnibox.onInputEntered.addListener(handleInputEntered);
