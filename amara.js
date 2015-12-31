//
// Globals
//

archivePDFLocation = { 
	'cb' : 'https://archive.org/stream/AmaraKosha/amara_english_colebrook',
	'hg' : 'https://archive.org/stream/AmaraKosha/amara_hindi_haragovinda',
	'ma' : 'https://archive.org/stream/AmaraKosha/amara_maheswara',
	'mi' : 'https://archive.org/stream/AmaraKosha/amara_maheswari_nsp',
	'vs' : 'https://archive.org/stream/AmaraKosha/amara_vyakya_sudha'
};

archivePDFOffset = { 
	'cb' : 30,
	'hg' : 27,
	'ma' : 21,
	'mi' : 1,
	'vs' : 6
};

archivePDFNames = {
	'cb' : 'colebrooke',
	'hg' : 'haragovinda',
	'ma' : 'maheshvara',
	'mi' : 'maheshvari',
	'vs' : 'vakyasudha'
};

audioAvailability = {
	'1.09.shabdaadi' : true
};

amaraAudio = undefined;
amaraAudioBase = "https://archive.org/download/AmaraKoshaAudio/";
amaraAudioCurrentlyPlaying = undefined;
amaraCurrentVarga = undefined;

//
// Helper functions
//


String.prototype.replaceAll = function(search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
}

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

String.prototype.startsWith = function (prefix) {
    return this.slice(0, prefix.length) == prefix;
}

function PrintJsonToConsole (someObject) {
	var json = JSON.stringify(someObject, null, 2);
	console.log(json);
}

function Pad (str, max) {
  str = str.toString();
  return str.length < max ? Pad("0" + str, max) : str;
}

function PlayAmara(filename) {
	if (amaraAudio !== undefined) {
		var paused = amaraAudio.paused;
		if (!paused) {
			amaraAudio.pause();
			amaraAudio = undefined;
	
			if(amaraAudioCurrentlyPlaying === filename) {
				amaraAudioCurrentlyPlaying = undefined;
				return;
			}
		}
	}

	var qualifiedFilename = amaraAudioBase + filename;
	console.log('Playing ' + qualifiedFilename);
	amaraAudio = new Audio(qualifiedFilename);
	amaraAudio.play();	
	amaraAudioCurrentlyPlaying = filename;
}


//
// On-library load
//

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

if ($.urlParam('varga') !== null && $.urlParam('varga') !== undefined) {
//	document.getElementById('navigation').innerHTML = '';
	LoadVarga($.urlParam('varga'));
} else {
	LoadVarga('1.09.shabdaadi');
}

//
// Bulk of the code
//

function LoadVarga(varga) {
	amaraCurrentVarga = varga;
	$.ajax({
		url : 'data/' + varga + '.txt',
		success : function(result){

			var $vargaData = result;

			if (result.redirect) {
				$.ajax({
					url : result.redirect,
					success : function(redirectedResult){
						$vargaData = redirectedResult;
					}
				});
			}


			var processedData = ProcessData($vargaData);
			var dataAsHtml = ConvertProcessedDataToHtml(processedData);

			console.log(dataAsHtml);


			document.getElementById('measure').innerHTML = '&nbsp;&nbsp;';
			document.getElementById('amara').innerHTML = dataAsHtml;

			// If hash-anchor is specified, stroll into view
			// Otherwise, if scrollToBottom is specified as a query parameter, scroll to bottom
			// The later is meant for quick reloads when adding new data to a varga

			var hash = window.location.hash.substring(1);
			if (hash !== undefined && hash !== null && hash !== '') {
				var nPos = document.getElementById(hash).offsetTop
				window.scrollBy(0,nPos)
			} else if ($.urlParam('scrollToBottom') === 'true') {
				window.scrollTo(0,document.body.scrollHeight);		
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) { 
        	alert("Status: " + textStatus); alert("Error: " + errorThrown); 
       	}   
	});
}

function VargaSelected() {
	var e = document.getElementById("varga");
	var strVarga = e.options[e.selectedIndex].value;
	// console.log(strVarga)
	LoadVarga(strVarga);
}	

function ConvertProcessedDataToHtml(processedData) {

	var output = '';
	var newline = '\r\n'
	var tab = '    ';

	var slokaNumber = 1;

	for (var i=0; i<processedData.length; i++) {
		
		processNext:
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

		// sloka number

		var numberToEmit = '';
		if (processedData[i].Parameters.noLineNumber !== undefined) {
			numberToEmit = '**';
		} else {

			if (processedData[i].Parameters.lineNumber !== undefined) {
				slokaNumber = processedData[i].Parameters.lineNumber;
			}

			if (processedData[i].ContinuePreviousLine === false) {
				numberToEmit  = slokaNumber++;
			}
		}


		if ($.urlParam('start') !== null && $.urlParam('start') !== undefined) {
			if ($.urlParam('start') >= slokaNumber) {
				continue;
			}
		}

		if ($.urlParam('end') !== null && $.urlParam('end') !== undefined) {
			if ($.urlParam('end') < slokaNumber-1) {
				continue;
			}
		}


		output += newline + '<!-- new row -->' + newline; 		
//		output += '<table>';
		output += '<tr class="nobreakafter">' + newline;
		

		output += '<td class="slokaNumber" id="' + slokaNumber + '">' + numberToEmit + '</td>' + newline;

		//
		// translation
		//

		var sktTranslation = '';
		if ($.urlParam('omitSanskritTranslation') !== 'true') {
			if (processedData[i].SanskritTranslation.length > 0) {
				sktTranslation += processedData[i].SanskritTranslation.trim() + ' ';
			}
		}

		var englishTranslation = '';
		if ($.urlParam('omitEnglishTranslation') !== 'true') {
			englishTranslation = processedData[i].Translation;
		}

		output += '<td class="trans" width=200>';
		output += sktTranslation + englishTranslation;
		output += '</td>' + newline;
		
		output += '<td class="main"><table>' + newline;
		output += tab + '<tr class="nobreakafter"><td width="' + mulamPadding + 'px">' + '</td></tr>	' + newline;			
		var mulamPadding = 0;
		
		//
		// genders
		// note: if omitGenders is specific, emit a space instead of the gender
		// to leave the rest of the spacing intact
		//		

		output += tab + '<tr class="gender nobreakafter"><td></td>';
		for (var j=0; j<processedData[i].Parts.length; j++) {
			output += '<td>';		
			if (processedData[i].Parts[j].IsFiller === false) {
				if ($.urlParam('omitGenders') === 'true') {
					output += '&nbsp;';
				} else {
					output += processedData[i].Parts[j].Genders;
				}
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
			
			try {
				if (processedData[i].Parts[j].IsFiller === false) {
					for (var k=0; k<processedData[i].Parts[j].Words.length; k++) {
						tip += processedData[i].Parts[j].Words[k].Word + ' ' + processedData[i].Parts[j].Words[k].Gender + '\r\n';
					}
				}
			} catch (err) {
				throw 'Error processing entry: ' + JSON.stringify(processedData[i], null, 2);
			}

			//
			// output the portion of the mula sloka
			//

			// optionally add colours to genders
			var genderClass='';
			if ($.urlParam('omitMulamColours') !== 'true') {
				if (processedData[i].Parts[j].Words !== undefined && processedData[i].Parts[j].Words.length >= 1) {
					var currentWordGender = processedData[i].Parts[j].Words[0].Gender;
					if (currentWordGender === 'm') {
						genderClass = 'male';
					} else if (currentWordGender === 'f') {
						genderClass = 'female';
					} else if (currentWordGender === 'n') {
						genderClass = 'neuter';
					} else if (currentWordGender === 'a') {
						genderClass = 'adjective';
					} else {
						genderClass = 'black';
					}
				}
			}


			var mainEntryText = processedData[i].Parts[j].Part.replaceAll(' ', '&nbsp;');
			mainEntryText = '<div class="' + genderClass + '">' + mainEntryText + '</div>';			
			if (genderClass !== '' && genderClass !== 'black') {
				var word = processedData[i].Parts[j].Words[0].Word;
				var apteLink = 'http://dsalsrv02.uchicago.edu/cgi-bin/philologic/search3advanced?dbname=apte&query=' + word + '&searchdomain=headwords&matchtype=start&display=utf8';
				mainEntry = '<a class="' + genderClass + ' apte" href="' + apteLink + '">' + mainEntryText + '</a>';			
			}
		

// <div class="box"><iframe src="http://en.wikipedia.org/" width = "500px" height = "500px"></iframe></div>
			

			output += '<td>'; 	
			output += '<span ' + genderClass + 'title="' + tip + '">' + mainEntryText + '</span>';
			output += '</td>';					
		}
		output += '</tr>' + newline;
		output += '</table></td>' + newline;

		// audio references
		if ($.urlParam('omitAudio') !== 'true' && audioAvailability[amaraCurrentVarga] === true ) {

			var audioLinks = '';

			if (processedData[i].Parameters.noLineNumber === undefined && processedData[i].ContinuePreviousLine !== true) {
				// Play via javascript
				var onClick = 'PlayAmara(\'amara-line-' + Pad(slokaNumber-1, 4) + '.mp3\')';

				// Play directly for one-page playback
				audioLinks += '<img height="15" onclick="' + onClick + '" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Crystal_Clear_app_knotify.png"></img> ';
				audioLinks += '&nbsp;&nbsp;';
			}

			output += '<td>' + audioLinks + '</td>';
		}

	
		// pdf references
		var pdfLinks = '';
		for(var propertyName in processedData[i].Parameters) {
			if (propertyName.startsWith('pdf_')) {
				var pdfType = propertyName.substring(4);
				var title = ' title="' + archivePDFNames[pdfType] + '" ';
				var pageNumber = processedData[i].Parameters[propertyName] + archivePDFOffset[pdfType];
				var location = archivePDFLocation[pdfType] + '#page/n' + pageNumber + '/mode/1up'; 
				pdfLinks += '<a ' + title + 'target="' + pdfType + '" href="' + location + '">' + archivePDFNames[pdfType] + '</a> ';
			}			
		}		

		if (pdfLinks !== '') {
			pdfLinks = '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ec/Pdf_by_mimooh.svg" height=15/> ' + pdfLinks;
		}

		//
		// words
		//
		var tip = '';		
		if ($.urlParam('omitWordList') !== 'true') {
			for (var j=0; j<processedData[i].Parts.length; j++) {
				if (processedData[i].Parts[j].IsFiller === false) {
					for (var k=0; k<processedData[i].Parts[j].Words.length; k++) {
						tip += processedData[i].Parts[j].Words[k].Word + ' ' + processedData[i].Parts[j].Words[k].Gender + '\r\n';
					}
				}
			}
		}
		
		output += '<td class="words" width=200>' + tip.replaceAll('\r\n', '. ') + pdfLinks + '</td>';
//		output += '</table>';
		
//		output += '<tr class="breakafter"><td>&nbsp;</td></tr>';

// 		output += '<span title="' + tip + '">' + processedData[i].Translation + '</span> -- ';

	}
	
//	console.log(output);
	return output;
}

function ProcessData(result) {
	var ret = [];

	// normalize line endings by treating \r\n\n as a single line	
	var splitResult = result.replaceAll('\n\n', '\n').split(/\r?\n/);	
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
	var splitSanskrit = [];
	var jsonData = [];
	
	var splitVerses = entry[0].replaceAll('+', '$$+').split('$$');	
	if (entry.length >= 2) {
		splitWords = entry[1].replaceAll('+', '$$+').split('$$');
	}
	if (entry.length >= 3) {
		splitEnglish = entry[2].replaceAll('+', '$$+').split('$$');
	}
	if (entry.length >= 4) {
		splitSanskrit = entry[3].replaceAll('+', '$$+').split('$$');
	}

	// Read other arbitrary json
	for (var i=0; i<entry.length; i++) {
		if (entry[i].length > 0 && entry[i][0] === '{') {
			jsonData.push(entry[i]);
		}
	}


	// If the number of entries don't match, try auto-splitting the list of words
//	if (splitVerses.length != splitWords.length && splitWords !== null && splitWords !== undefined && splitWords.length !== 0) {
//		splitEnglish = entry[2].replaceAll(',', '$$+').split('$$');
//
//		throw 'Unmatched entries: \r\n' + entry[0] + '\r\n' + entry[1];
//	}

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
			if (i < splitSanskrit.length) {
				singleEntry.push(splitSanskrit[i].replace('+', ''));
			}
		
			ret.push(singleEntry);
		}
	}

	for (var i=0; i<jsonData.length; i++) {
		ret[0].push(jsonData[i]);
	}

//	$.extend(jsonData, ret[0], jsonData);
//	ret[0] = jsonData;
	
	return ret;
}

function ParseEntry(entry) {
	if (entry === undefined || entry.length < 1) {
		console.log ('error');
	}	

	var nonJsonData = [];
	var jsonData = new Object();
	for (var i=0; i<entry.length; i++) {
		if (entry[i].length > 0 && entry[i][0] === '{') {
			var newData = JSON.parse(entry[i]);
			$.extend(jsonData, newData);
		} else { 
			nonJsonData.push(entry[i]);
		}
	}

	entry = nonJsonData;
	//console.log(JSON.stringify(jsonData, null, 2));


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

	parsedVerse.SanskritTranslation = '';
	if (entry.length >= expectedLength++) {
		if (entry[3] !== null && entry[3] !== '') {
			parsedVerse.SanskritTranslation = entry[3];
		}
	}

	parsedVerse.Translation = parsedVerse.Translation.trim();
	parsedVerse.SanskritTranslation = parsedVerse.SanskritTranslation.trim();


	parsedVerse.Parameters = jsonData;	
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