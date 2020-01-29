const educationData =
	'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
const countyData =
	'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';

const findMatch = (data, obj) => data.find(i => obj.id === i.fips);

const width = 960,
	height = 600,
	legendHeight = 15,
	minX = 2.6,
	maxX = 75.1;

const tooltip = d3.select('.tooltip');
const path = d3.geoPath();
const unemployment = d3.map();

const x = d3
	.scaleLinear()
	.domain([minX, maxX])
	.rangeRound([600, 860]);

const color = d3
	.scaleThreshold()
	.domain(d3.range(minX, maxX, (maxX - minX) / 8))
	.range(d3.schemeBlues[9]);

const svg = d3
	.select('.choropleth')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

const g = svg
	.append('g')
	.attr('class', 'key')
	.attr('id', 'legend')
	.attr('transform', 'translate(0,40)');

g.selectAll('rect')
	.data(
		color.range().map(d => {
			inv = color.invertExtent(d);
			if (!inv[0]) inv[0] = x.domain()[0];
			if (!inv[1]) inv[1] = x.domain()[1];
			return inv;
		})
	)
	.enter()
	.append('rect')
	.attr('fill', d => color(d[0]))
	.attr('height', legendHeight)
	.attr('width', d => x(d[1]) - x(d[0]))
	.attr('x', d => x(d[0]));

g.call(
	d3
		.axisBottom(x)
		.tickSize(legendHeight)
		.tickPadding(5)
		.tickFormat(x => `${Math.round(x)}%`)
		.tickValues(color.domain())
)
	.select('.domain')
	.remove();

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
		.attr('d', path)
		.on('mouseover', d => {
			const { state, area_name, bachelorsOrHigher } = findMatch(education, d);
			const info = `
        <p class="location">${area_name}, ${state}</p>
        <p class="education">${bachelorsOrHigher}%</p>
      `;
			tooltip
				.html(info)
				.attr('data-education', bachelorsOrHigher)
				.style('background', color(bachelorsOrHigher))
				.style('color', () => (bachelorsOrHigher > 48 ? '#fff' : '#000'))
				.style('left', `${d3.event.pageX + 10}px`)
				.style('top', `${d3.event.pageY - 75}px`)
				.style('opacity', 1);
		})
		.on('mouseout', () => tooltip.style('opacity', 0));

	svg
		.append('path')
		.datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
		.attr('class', 'states')
		.attr('d', path);
};

d3.queue()
	.defer(d3.json, countyData)
	.defer(d3.json, educationData)
	.await(choropleth);
