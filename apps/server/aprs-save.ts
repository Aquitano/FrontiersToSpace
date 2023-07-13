let data = document.querySelectorAll('body > div.table-responsive > div > span.raw_line');

let result = [];

data.forEach((d) => {
	let text = d.innerText;
	// Replace non-breaking space characters with regular space characters
	let withoutNBSP = text.replace(/\u00A0/g, ' ');
	// Split the text by "CEST: "
	let parts = withoutNBSP.split('CEST: ');
	// The first part is the date, the second part is the rest of the string
	let date = parts[0].trim(); // Use trim to remove whitespace
	let withoutDate = parts[1];
	// Add the date and the rest of the string as a sub-array to the result
	result.push([date, withoutDate]);
});

console.log(result);
