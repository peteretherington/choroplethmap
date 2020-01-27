const EDUCATION_FILE =
	'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const COUNTY_FILE =
	'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

const width = 960,
	height = 600,
	minX = 2.6,
	maxX = 75.1;

const svg = d3
	.select('.choropleth')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

const path = d3.geoPath();
const unemployment = d3.map();

const x = d3
	.scaleLinear()
	.domain([minX, maxX])
	.rangeRound([600, 860]);

const color = d3
	.scaleThreshold()
	.domain(d3.range(minX, maxX, (maxX - minX) / 8))
	.range(d3.schemeGreens[9]);

const findMatch = (data, obj) => data.find(i => obj.id === i.fips);

const choropleth = (error, us, education) => {
	if (error) throw error;

	svg
		.append('g')
		.attr('class', 'counties')
		.selectAll('path')
		.data(topojson.feature(us, us.objects.counties).features)
		.enter()
		.append('path')
		.attr('class', 'county')
		.attr('data-fips', d => d.id)
		.attr('data-education', d => {
			const match = findMatch(education, d);
			if (match) return match.bachelorsOrHigher;
			console.log(`Could not find data for: ${d.id}`);
			return 0;
		})
		.attr('fill', d => {
			const match = findMatch(education, d);
			if (match) return color(match.bachelorsOrHigher);
			return color(0);
		})
		.attr('d', path);

	svg
		.append('path')
		.datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
		.attr('class', 'states')
		.attr('d', path);
};

d3.queue()
	.defer(d3.json, COUNTY_FILE)
	.defer(d3.json, EDUCATION_FILE)
	.await(choropleth);
