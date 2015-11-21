function getUrlComponentForOmit(option) {

	var geniusMode = (document.getElementById('geniusMode').checked === true);
	var retString = '';

	var checkedState = document.getElementById(option).checked;
	if (geniusMode === true || checkedState === true) {
		retString = '&' + option + '=true';
	}

	Cookies.set(option, checkedState);

	return retString;
}

amaraDisplayOptions = ['omitMulamColours', 'omitGenders', 'omitEnglishTranslation', 'omitSanskritTranslation', 'omitAudio', 'omitWordList'];

function navigateToVarga(varga){
	var hrefString = 'amara.html?varga=' + varga;

	for (var i=0; i<amaraDisplayOptions.length; i++) {
		hrefString += getUrlComponentForOmit(amaraDisplayOptions[i]);
	}
	window.location.href = hrefString;
}

function loadStateFromCookie() {
	for (var i=0; i<amaraDisplayOptions.length; i++) {
		var cookie = Cookies.get(amaraDisplayOptions[i]);
		if (cookie === 'true') {
			var checkBox = document.getElementById(amaraDisplayOptions[i]);
			checkBox.checked = true;
		}
	}
}

window.onload = function() {
	loadStateFromCookie();
};