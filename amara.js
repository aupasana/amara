
// RunTests();

String.prototype.replaceAll = function(search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
}

// default varga
LoadVarga('2.02.bhuumi');
//LoadVarga('in-progress');

function LoadVarga(varga) {
	$.ajax({
		url : varga + '.txt',
		success : function(result){
			var processedData = ProcessData(result);
			var dataAsHtml = ConvertProcessedDataToHtml(processedData);

			document.getElementById('measure').innerHTML = '&nbsp;&nbsp;';
			document.getElementById('amara').innerHTML = dataAsHtml;
			
				window.scrollTo(0,document.body.scrollHeight);		
		}
	});
}

function VargaSelected() {
	var e = document.getElementById("varga");
	var strVarga = e.options[e.selectedIndex].value;
	console.log(strVarga)
	LoadVarga(strVarga);
}	

function ConvertProcessedDataToHtml(processedData) {

	var output = '';
	var newline = '\r\n'
	var tab = '    ';
	var slokaNumber = 1;
	
	for (var i=0; i<processedData.length; i++) {
		
		var mulamPadding = 0;
		if (processedData[i].ContinuePreviousLine === true) {
			var back = i;
			var previousLine = '';
			do {
				back --;
				for (var j=0; j<processedData[back].Parts.length; j++) {
					previousLine += processedData[back].Parts[j].Part;
				}
			} while (processedData[back].ContinuePreviousLine === true);
			var measureElement = document.getElementById('measure'); 
			measureElement.innerHTML = previousLine;
			mulamPadding = measureElement.offsetWidth + ((i-back)*20);
		}		


		output += newline + '<!-- new row -->' + newline; 		
//		output += '<table>';
		output += '<tr class="nobreakafter">' + newline;
		
		// sloka number
		var numberToEmit = '';
		if (processedData[i].ContinuePreviousLine === false) {
			numberToEmit  = slokaNumber++;
		}
		output += '<td class="slokaNumber">' + numberToEmit + '</td>' + newline;
		output += '<td class="trans" width=200>';
		output += processedData[i].Translation;
		output += '</td>' + newline;
		
		output += '<td class="main"><table>' + newline;
		output += tab + '<tr class="nobreakafter"><td width="' + mulamPadding + 'px">' + '</td></tr>	' + newline;			
		var mulamPadding = 0;
		
		//
		// genders
		//		
		output += tab + '<tr class="gender nobreakafter"><td></td>';
		for (var j=0; j<processedData[i].Parts.length; j++) {
			output += '<td>';		
			if (processedData[i].Parts[j].IsFiller === false) {
				output += processedData[i].Parts[j].Genders;
			}
			output += '</td>';					
		}
		output += '</tr>' + newline;		

		//
		// sloka parts
		//				
		output += tab + '<tr class="breakafter"><td></td>';

		for (var j=0; j<processedData[i].Parts.length; j++) {
			var tip = '';
			if (processedData[i].Parts[j].IsFiller === false) {
				for (var k=0; k<processedData[i].Parts[j].Words.length; k++) {
					tip += processedData[i].Parts[j].Words[k].Word + ' ' + processedData[i].Parts[j].Words[k].Gender + '\r\n';
				}
			}

			output += '<td>'; 	
			output += '<span title="' + tip + '">' + processedData[i].Parts[j].Part.replaceAll(' ', '&nbsp;') + '</span>';
			output += '</td>';					
		}
		output += '</tr>' + newline;
		output += '</table></td>' + newline;
		

		//
		// words
		//
		var tip = '';		
		for (var j=0; j<processedData[i].Parts.length; j++) {
			if (processedData[i].Parts[j].IsFiller === false) {
				for (var k=0; k<processedData[i].Parts[j].Words.length; k++) {
					tip += processedData[i].Parts[j].Words[k].Word + ' ' + processedData[i].Parts[j].Words[k].Gender + '\r\n';
				}
			}
		}
		
		output += '<td class="words" width=200>' + tip.replaceAll('\r\n', '. ') + '</td>';
//		output += '</table>';
		
//		output += '<tr class="breakafter"><td>&nbsp;</td></tr>';

// 		output += '<span title="' + tip + '">' + processedData[i].Translation + '</span> -- ';

	}
	
	console.log(output);
	return output;
}

function ProcessData(result) {
	var ret = [];
		
	var splitResult = result.split(/\r?\n/);	
	var lineNumber = 0;
	var entry = [];
	while (lineNumber < splitResult.length) {
		var line = splitResult[lineNumber];
		
		if (line !== undefined && line.length >= 5 && line.substring(0,5) == '*****') {
			return ret;
		}
		
		if (line !== undefined && line.length >= 2 && line.substring(0,2) === '--') {
			if (entry[0] !== null) {
				// composite entries
				var compositeEntries = NormalizeCompositeEntry(entry);
				for (var i=0; i<compositeEntries.length; i++) {
					var parsedEntry = ParseEntry(compositeEntries[i]);
					ret.push(parsedEntry);
				}				
			} else {						
				// regular entries
				var parsedEntry = ParseEntry(entry);
				ret.push(parsedEntry);
			}
			entry = [];
		} else {
			entry.push(line);
		}
		
		lineNumber++;

	}

//	console.log(JSON.stringify(ret, null, 2));
	return ret;
	
}

function NormalizeCompositeEntry(entry) {
	if (entry.length < 1) {
		return entry;
	}
	
	var splitVerses = [];
	var splitWords = [];
	var splitEnglish = [];
	
	var splitVerses = entry[0].replaceAll('+', '$$+').split('$$');	
	if (entry.length >= 2) {
		splitWords = entry[1].replaceAll('+', '$$+').split('$$');
	}
	if (entry.length >= 3) {
		splitEnglish = entry[2].replaceAll('+', '$$+').split('$$');
	}

	var ret = [];
	
	for (var i=0; i<splitVerses.length; i++) {
		
		if (splitVerses[i] !== null && splitVerses[i] != '') {
		var singleEntry = [];
		
		var singleVerse = splitVerses[i];
		
		singleEntry.push(singleVerse);
		if (i < splitWords.length) {
			singleEntry.push(splitWords[i].replace('+', ''));
		}
		if (i < splitEnglish.length) {
			singleEntry.push(splitEnglish[i].replace('+', ''));
		}
		
		ret.push(singleEntry);
		}
	}
	
	return ret;
}

function ParseEntry(entry) {
	if (entry === undefined || entry.length < 1) {
		console.log ('error');
	}	

	var parsedVerse = null;
	var parsedWords = null;
		
	var expectedLength = 1;
	if (entry.length >= expectedLength++) {
		parsedVerse = ParseVerse(entry[0]);
	}
	
	if (entry.length >= expectedLength++) {
		parsedWords = ParseWords(entry[1]);

		var wordIndex=0;
		for (var i=0; i<parsedVerse.Parts.length; i++) {
			if (parsedVerse.Parts[i].IsFiller === true) {
			} else {
				if (wordIndex < parsedWords.length) { 
					parsedVerse.Parts[i].Genders = parsedWords[wordIndex].Genders;
					parsedVerse.Parts[i].Words = parsedWords[wordIndex].Words;
					wordIndex++;
				} else {
					parsedVerse.Parts[i].Genders = '??';
					parsedVerse.Parts[i].Words = [ { Word: '?', Gender: '?' } ];
				}
			}
		}
	}

	parsedVerse.Translation = ' . . . ';	
	if (entry.length >= expectedLength++) {
		if (entry[2] !== null && entry[2] !== '') {
			parsedVerse.Translation = entry[2];
		}
	}
	
	return parsedVerse;	
}

function ParseWords(wordsLine) {
	var returnWords = [];
	
	if (wordsLine.indexOf('{') < 0) {
		return returnWords;
	}
	
	var wordsLineWithoutSpaces = wordsLine.replace(/\s+/g, '');
	var words = wordsLineWithoutSpaces.split(',');
	for (var i=0; i<words.length; i++) {
		
		var alternateWords = words[i].split('|');
		var returnAlternateWords = [];
		
		var isMale = false;
		var isFemale = false;
		var isNeuter = false;
		var isAdjective = false;
		
		for (var j=0; j<alternateWords.length; j++) {
			var wordsRegexp = /(.*){(.)}/g;
			var match = wordsRegexp.exec(alternateWords[j]);
			
			if (match === null) {
				throw 'No gender specified for word ' + alternateWords[j] + ' in line: ' + wordsLine;
			}
			
			var w = new Object();
			w.Word = match[1];
			w.Gender = match[2];
			
			if (w.Gender === 'm') {
				isMale = true;
			} else if (w.Gender === 'f') {
				isFemale = true;
			} else if (w.Gender === 'n') {
				isNeuter = true;
			} else if (w.Gender === 'a') {
				isAdjective = true;
			}
						
			returnAlternateWords.push(w);
		}
		
		var aw = new Object();
		aw.Words = returnAlternateWords;
		aw.Genders = '';
		
		if (isMale) {
			aw.Genders += 'm';
		}
		if (isFemale) {
			aw.Genders += 'f';
		}
		if (isNeuter) {
			aw.Genders += 'n';
		}
		if (isAdjective) {
			aw.Genders += 'a';
		}
		
		if (aw.Genders === '') {
			aw.Genders = '?';
		}
		
		returnWords.push(aw);		
	}
	
	return returnWords;
}

function ParseVerse(verse) {
	var returnWords = [];
	var verseWord;
	var verseFiller;
	var continuePreviousLine = false;

	var modifiedVerse = verse;

	if (verse.length > 0 && verse[0] === '+') {
		continuePreviousLine = true;
		modifiedVerse = modifiedVerse.substring(1);
	}
	
	modifiedVerse = modifiedVerse.split('[').join('#');
	modifiedVerse = modifiedVerse.split(']').join('#');
	
	var myregexp = /([^#]*)#([^#]*)#/g;	
	var match = myregexp.exec(modifiedVerse);	
	
	while (match !== null) {
		if (match[1] !== undefined && match[1] != '') {
			returnWords.push({'Part': match[1], IsFiller : true });
		}
		if (match[2] !== undefined && match[2] != '') {
			returnWords.push({'Part': match[2], IsFiller : false });
		}
		match = myregexp.exec(modifiedVerse);
	}	
	
	myregexp = /([^#]*)$/g;
	match = myregexp.exec(modifiedVerse);	

	if (match !== null && match[1] !== undefined && match[1] != '') {
		returnWords.push({'Part': match[1], IsFiller: true});
	}
	
	for (var i=0; i<returnWords.length; i++) {
		if (returnWords[i].IsFiller === true) {
			var fillerRegexp = /^([ ]*)(.*[^ ])([ ]*)$/;
			var fillerMatch = fillerRegexp.exec(returnWords[i].Part);
			if (fillerMatch !== null && fillerMatch[2] !== '') {
				returnWords[i].Part = fillerMatch[1] + /*'(' +*/ fillerMatch[2] + /*')' +*/ fillerMatch[3];
			}
		}
	}
	
	var ret = new Object();
	ret.ContinuePreviousLine = continuePreviousLine;
	ret.Parts = returnWords;
	
	return ret;
}

function RunTests() {
	console.log ('Running Tests');
	var tr;
	
	tr = ParseVerse('[darI]');
	AssertEqual (tr.Parts.length, 1);
	AssertEqual (tr.Parts[0].Part, "darI");
	AssertEqual (tr.Parts[0].IsFiller, false);
	AssertEqual (tr.ContinuePreviousLine, false);

	tr = ParseVerse("+darI");
	AssertEqual (tr.Parts.length, 1);
	AssertEqual (tr.Parts[0].Part, "(darI)");
	AssertEqual (tr.Parts[0].IsFiller, true);
	AssertEqual (tr.ContinuePreviousLine, true);

	tr = ParseVerse(" [ArAmaH] syAt [upavanam] ");
	AssertEqual (tr.Parts.length, 5);
	AssertEqual (tr.Parts[0].Part, " ");
	AssertEqual (tr.Parts[0].IsFiller, true);
	AssertEqual (tr.Parts[1].Part, "ArAmaH");
	AssertEqual (tr.Parts[1].IsFiller, false);
	AssertEqual (tr.Parts[2].Part, " (syAt) ");
	AssertEqual (tr.Parts[2].IsFiller, true);
	AssertEqual (tr.Parts[3].Part, "upavanam");
	AssertEqual (tr.Parts[3].IsFiller, false);
	AssertEqual (tr.Parts[4].Part, " ");
	AssertEqual (tr.Parts[4].IsFiller, true);

	tr = ParseWords("ArAmaH{m}, upavanam{n}");
	AssertEqual (tr.length, 2);
	AssertEqual (tr[0].Genders, 'm');
	AssertEqual (tr[0].Words.length, 1);
	AssertEqual (tr[0].Words[0].Word, 'ArAmaH');
	AssertEqual (tr[0].Words[0].Gender, 'm');
	AssertEqual (tr[1].Genders, 'n');
	AssertEqual (tr[1].Words.length, 1);
	AssertEqual (tr[1].Words[0].Word, 'upavanam');
	AssertEqual (tr[1].Words[0].Gender, 'n');
	
	tr = ParseWords("darI{f}, kandaraH{m} | kandarI {f}");
	AssertEqual (tr.length, 2);
	AssertEqual (tr[0].Genders, 'f');
	AssertEqual (tr[0].Words.length, 1);
	AssertEqual (tr[0].Words[0].Word, 'darI');
	AssertEqual (tr[0].Words[0].Gender, 'f');
	AssertEqual (tr[1].Genders, 'mf');
	AssertEqual (tr[1].Words.length, 2);
	AssertEqual (tr[1].Words[0].Word, 'kandaraH');
	AssertEqual (tr[1].Words[0].Gender, 'm');
	AssertEqual (tr[1].Words[1].Word, 'kandarI');
	AssertEqual (tr[1].Words[1].Gender, 'f');
	
		
	console.log ('Tests complete');
}

function AssertEqual (a, b) {
	if (a !== b) {
		throw 'Assertion failed: ' + a + ' !== ' + b + '.';
	}
}