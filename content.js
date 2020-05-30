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

function getAuthorFromGallery(doc)
{
	// Text is always in a text node, hence the last childNodes[0]
	return doc.getElementById("tags").children[3].children[0].children[0].childNodes[0].nodeValue;
}

function getLanguageFromGallery(doc)
{
	// Text is always in a text node, hence the last childNodes[0]
	var first_lang = doc.getElementById("tags").children[5].children[0].children[0].childNodes[0].nodeValue;
	// don't return "translated"
	if (first_lang.includes("translated"))
	{
		return doc.getElementById("tags").children[5].children[0].children[1].childNodes[0].nodeValue;
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

function getCurrentPageNumber()
{
	// Text is always in a text node, hence the last childNodes[0]
	return document.getElementsByClassName("current")[0].childNodes[0].nodeValue;
}

function setDefaultQueryFromGallery(doc)
{
	var curAuthor = getAuthorFromGallery(doc); // includes a space
	
	var curLang = getLanguageFromGallery(doc); // includes a space
	var tarLang = "";
	if (curLang.includes("english"))
	{
		tarLang = "japanese " // includes a space
	}
	else
	{
		tarLang = "english " // includes a space
	}
	
	var curTitle = getTitleFromGallery(doc);
	
	defaultQuery = curAuthor + tarLang + curTitle;
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

function swapImageByIdOrPrompt()
{
	if (onOriginal)
	{
		if (!pId)
		{
			var query = prompt("Provide a search query", defaultQuery);
			httpGetAsync("https://nhentai.net/search/?q="+query+"&sort=popular", swapImageByQuery);
		}
		else // if we already have the id, use it
		{
			httpGetAsync("https://nhentai.net/g/"+pId+"/"+getCurrentPageNumber()+"/", replaceImgWithImg);
			onOriginal = false;
			
			a_next.setAttribute("href", next.href+"?pId="+pId);
			a_prev.setAttribute("href", prev.href+"?pId="+pId);
		}
	}
	else // Reset To Original Image
	{
		httpGetAsync("https://nhentai.net/g/"+curId+"/"+getCurrentPageNumber()+"/", replaceImgWithImg);
		onOriginal = true;
	}
}

function swapImageByQuery(doc)
{
	var a = doc.getElementsByClassName("cover")[0];
	pId = getHentaiIdFromUrl(a.href);
	swapImageByIdOrPrompt();
}

function setDefaultQuery()
{
	var curHentaiId = getHentaiIdFromUrl(window.location.href);
	httpGetAsync("https://nhentai.net/g/"+curHentaiId, setDefaultQueryFromGallery);
}

// Layout/Visuals

var div=document.createElement("div");
div.id="biHDiv"

var a_next=document.createElement("a");
var b_trans=document.createElement("button");
var a_prev=document.createElement("a");

a_next.innerHTML="Next";
b_trans.innerHTML="あ";
a_prev.innerHTML="Prev";

div.appendChild(a_next);
div.appendChild(b_trans);
div.appendChild(a_prev);

var pageCont=document.getElementById("page-container");
var imgCont=document.getElementById("image-container");
pageCont.insertBefore(div, imgCont);

// Functionality

var params = getParams(window.location.href);
var pId = params["pId"]; // Pair ID: TODO STORE IN BACKGROUND?
var defaultQuery = ""

var next=document.getElementsByClassName("next")[0];
var prev=document.getElementsByClassName("previous")[0];

if (pId)
{
	a_next.setAttribute("href", next.href+"?pId="+pId);
	a_prev.setAttribute("href", prev.href+"?pId="+pId);
}
else
{
	a_next.setAttribute("href", next.href);
	a_prev.setAttribute("href", prev.href);
	setDefaultQuery();
}

var curId = getHentaiIdFromUrl(window.location.href);
var onOriginal = true;
b_trans.onclick = swapImageByIdOrPrompt;