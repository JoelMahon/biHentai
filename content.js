function httpGetAsync(theUrl, callback)
{
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.responseType = "document";
	xmlHttp.onreadystatechange = function()
	{ 
        	if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
		{
			callback(xmlHttp.response);
		}
	}
	xmlHttp.open("GET", theUrl, true); // true for asynchronous 
	xmlHttp.send(null);
}

function getTagText(doc, tagTypeIndex, tagIndex)
{
	// Text is always in a text node, hence the last childNodes[0]
	return doc.getElementById("tags").children[tagTypeIndex].children[0].children[tagIndex].children[0].childNodes[0].nodeValue;
}

function getAuthorFromGallery(doc)
{
	return getTagText(doc, 3, 0);
}

function getLanguageFromGallery(doc)
{
	// Text is always in a text node, hence the last childNodes[0]
	var first_lang = getTagText(doc, 5, 0);
	// don't return "translated"
	if (first_lang.includes("translated"))
	{
		return getTagText(doc, 5, 1);
	}
	return first_lang;
}

function getTitleFromGallery(doc)
{
	var metas = doc.getElementsByTagName("meta");
	for (let i = 0; i < metas.length; i++)
	{
		if (metas[i].getAttribute("itemprop") == "name")
		{
			return metas[i].getAttribute("content");
		}
	}
	return "";
}

function getHentaiIdFromUrl(url)
{
	var splt = url.split("/");
	for (var i = 0; i < splt.length; i++)
	{
		if (splt[i] === "g")
		{
			return splt[i+1];
		}
	}
	return "";
}

function getTargetPageNumber()
{
	// Use +s before strings to convert them to numeric
	// Text is always in a text node, hence the last childNodes[0]
	return +getCurrentPageNumber() + +pShift;
}

function getCurrentPageNumber()
{
	// Text is always in a text node, hence the last childNodes[0]
	return document.getElementsByClassName("current")[0].childNodes[0].nodeValue;
}

function setDefaultQueryFromGallery(doc)
{
	var curAuthor = getAuthorFromGallery(doc);
	
	var curLang = getLanguageFromGallery(doc);
	var tarLang = "";
	if (curLang.includes("english"))
	{
		tarLang = "japanese"
	}
	else
	{
		tarLang = "english"
	}
	
	var curTitle = getTitleFromGallery(doc);
	
	defaultQuery = curAuthor + " " + tarLang + " " + curTitle;
}

function replaceImgWithImg(doc)
{
	var curImg=document.getElementById("image-container").children[0].children[0];
	var newImg=doc.getElementById("image-container").children[0].children[0];
	curImg.src=newImg.src;
}

var getParams = function (url)
{
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++)
	{
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

function setImageToSwapped()
{
	httpGetAsync("https://nhentai.net/g/"+gId+"/"+getTargetPageNumber()+"/", replaceImgWithImg);
	onOriginal = 0;
	
	updatePagination();
}

function setImageToOriginal()
{
	httpGetAsync("https://nhentai.net/g/"+curId+"/"+getCurrentPageNumber()+"/", replaceImgWithImg);
	onOriginal = 1;
	
	updatePagination();
}

function swapImageByIdOrPrompt()
{
	if (onOriginal)
	{
		if (!gId)
		{
			var query = prompt("Provide a search query", defaultQuery);
			if (!query) return;
			httpGetAsync("https://nhentai.net/search/?q="+query+"&sort=popular", swapImageByQuery); // Finds ID then recursively calls swapImageByIdOrPrompt();
		}
		else // if we already have the id, use it
		{
			setImageToSwapped();
		}
	}
	else // Reset To Original Image
	{
		setImageToOriginal();
	}
}

function swapImageByQuery(doc)
{
	var a = doc.getElementsByClassName("cover")[0];
	if (!a)
	{
		alert("No galleries found", 500);
		return;
	}
	gId = getHentaiIdFromUrl(a.href);
	swapImageByIdOrPrompt();
}

function setDefaultQuery()
{
	var curHentaiId = getHentaiIdFromUrl(window.location.href);
	httpGetAsync("https://nhentai.net/g/"+curHentaiId, setDefaultQueryFromGallery);
}

function setButtonLink(butt, url)
{
	butt.setAttribute("onclick", "window.location.href='"+url+"';");
}

function updatePagination()
{
	var pShiftUrl = "?ps="+pShift;
	var orUrl = "&or="+onOriginal;
	if (gId)
	{
		var gIdUrl = "&gId="+gId;
		setButtonLink(b_next, next.href+pShiftUrl+orUrl+gIdUrl);
		setButtonLink(b_prev, prev.href+pShiftUrl+orUrl+gIdUrl);
	}
	else
	{
		setButtonLink(b_next, next.href+pShiftUrl+orUrl);
		setButtonLink(b_prev, prev.href+pShiftUrl+orUrl);
	}
}

// Layout/Visuals

var div=document.createElement("div");
div.id="biHDiv";

var b_next=document.createElement("button");
var div_trans=document.createElement("div");
var b_dec_shift=document.createElement("button");
b_dec_shift.className="biHButt";
var b_trans=document.createElement("button");
b_trans.className="biHButt";
var b_inc_shift=document.createElement("button");
b_inc_shift.className="biHButt";
var b_prev=document.createElement("button");

b_next.innerHTML="Next";
b_dec_shift.innerHTML="-";
b_trans.innerHTML="あ";
b_inc_shift.innerHTML="+";
b_prev.innerHTML="Prev";

div.appendChild(b_next);
div.appendChild(document.createElement("br"));
div.appendChild(b_dec_shift);
div.appendChild(b_trans);
div.appendChild(b_inc_shift);
div.appendChild(document.createElement("br"));
div.appendChild(div_trans);
div.appendChild(b_prev);

var pageCont=document.getElementById("content");
var imgCont=document.getElementById("image-container");
pageCont.insertBefore(div, imgCont);

// Functionality

var next=document.getElementsByClassName("next")[0];
var prev=document.getElementsByClassName("previous")[0];

var curId = getHentaiIdFromUrl(window.location.href);

var params = getParams(window.location.href);
var pShift = params["ps"] || 0; // Page Shift
var onOriginal = params["or"] === "0" ? 0 : 1; // On original language, converted to numeric
var gId = params["gId"]; // Gallery ID

var defaultQuery = "";
if (!gId)
{
	defaultQuery = setDefaultQuery();
}
else if (!onOriginal)
{
	onOriginal = 1;
	swapImageByIdOrPrompt();
}

b_trans.onclick = swapImageByIdOrPrompt;
b_dec_shift.onclick = function() { pShift--; onOriginal = 1; swapImageByIdOrPrompt(); }
b_inc_shift.onclick = function() { pShift++; onOriginal = 1; swapImageByIdOrPrompt(); }

updatePagination();