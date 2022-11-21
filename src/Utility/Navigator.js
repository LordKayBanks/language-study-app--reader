class Navigator {
	window = null;
	document = null;
	rootNode = null;
	walker = null;

	acceptedTags = [
		"address",
		"article",
		"aside",
		"footer",
		"header",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"h6",
		"main",
		"nav",
		"section",
		// "div",// hack for Pictures getting copied and read 2,3,4 times
		"p",
		// "table",
		// "tbody",
		"thead",
		"tr",
		"tfoot",
		"figcaption",
		"caption",
		"li",
		"pre",
		"code",
		//====
		// "img",
		// "video",
	];

	//===
	// lineColors = ["lime", "#ff0000c4", "#4d70eca6", "#ecde34c9", "#a52a2ac9"];
	lineColors = ["lime", "#ff0000c4", "#4d70eca6"];
	currentRef = null;
	currentRefDisplay = "none";
	textContent = "";
	clone = null;
	endOfSentence = new RegExp(
		/(?=\S)(([.]{2,})?[^!?]+?([.…!?]+|(?=\s+$)|$)(\s*[′’'”″“")»]+)*)/g
	);

	//========
	constructor(win, rootNode = null) {
		this.window = win;
		this.document = win.document;
		this.rootNode = rootNode ? rootNode : this.document.getElementsByTagName("body")[0];
		this.createWalker(this.document);
		// this.rootNode.addEventListener("click", this.handlePageClick);
		this.document.addEventListener("keypress", this.handleKeyPress);
	}

	//===============================
	handleKeyPress = ({ key }) => {
		key && key === "b" && this.backNavigation();
		key && key === "n" && this.forwardNavigation();
	};

	createWalker = (doc) => {
		this.walker = doc.createTreeWalker(
			this.rootNode,
			NodeFilter.SHOW_ELEMENT,
			(node) => {
				if (!this.acceptedTags.includes(node.tagName.toLowerCase())) {
					return NodeFilter.FILTER_SKIP;
				} else if (node.textContent.trim() === "") {
					return NodeFilter.FILTER_SKIP;
				} else return NodeFilter.FILTER_ACCEPT;
			},
			false
		);
		// this.lastChild = this.walker.lastChild();
		// console.log(lastChild);
		this.firstChild = this.walker.firstChild();
	};
	//==================================================
	//==================================================

	handlePageClick = (e) => {
		e.preventDefault();
		console.log("🚀 ==> e.target.tagName", e.target.tagName);
		// if (!this.acceptedTags.includes(e.target.tagName.toLowerCase())) return;
		let selection = this.document.getSelection();
		// selection.modify("extend", "backward", "paragraph");
		selection.modify("extend", "backward", "sentence");
		let { focusNode } = selection;
		if (!focusNode) return;

		let selectedElement = focusNode.parentElement.closest(this.acceptedTags.join(","));
		if (!selectedElement) return;

		selection.removeAllRanges();
		// console.log("🚀 ==> selectedElement", selectedElement);
		try {
			// console.log("🚀 ==> this.walker.currentNode", this.walker.currentNode);
			this.walker.currentNode = selectedElement;
			this.removeCloneFromPage();
			this.navigate();
		} catch (error) {
			console.log("🚀 ==> error", error);
			this.removeCloneFromPage();
			this.navigate();
		}
		return true;
	};
	//=======================================
	//=======================================

	forwardNavigation = (callback = (text) => {}) => {
		this.removeCloneFromPage();
		//==========
		try {
			this.walker.nextNode();
			let count = 0;
			while (this.walker.currentNode.textContent.trim() === "") {
				if (count > 50) break;

				this.walker.nextNode();
				count++;
			}

			this.navigate(callback);
		} catch (error) {
			console.log("🚀 ==> error", error);
			// this.walker.firstChild();
			this.forwardNavigation(callback);
		}
	};
	//=======================================
	//=======================================

	backNavigation = (callback = (text) => {}) => {
		this.removeCloneFromPage();
		//==========
		try {
			this.walker.previousNode();
			let count = 0;
			while (this.walker.currentNode.textContent.trim() === "") {
				if (count > 50) break;

				this.walker.previousNode();
				count++;
			}

			this.navigate(callback);
		} catch (error) {
			console.log("🚀 ==> error", error);
			// this.walker.lastChild();
			this.backNavigation(callback);
		}
	};

	navigate(callback = () => {}) {
		this.currentRef = this.walker.currentNode;

		const currentRefFontSize = this.window
			.getComputedStyle(this.currentRef)
			.getPropertyValue("font-size");

		this.clone = this.currentRef.cloneNode(true);
		this.removeUnwantedTagsFromElement(this.clone);
		this.textContent = this.clone.textContent.trim();
		let result = this.textContent.match(this.endOfSentence);
		// console.info(result);
		result = result.map((sentence) => sentence.trim()).filter(Boolean);
		result = this.splitSentenceIntoWords(result, currentRefFontSize);
		this.appendCloneToPage(result, callback);
	}

	removeUnwantedTagsFromElement(element) {
		const unwantedTags = element.querySelectorAll("sup,sub");
		for (let tags of unwantedTags) {
			tags.parentElement.removeChild(tags);
		}
	}

	splitSentenceIntoWords = (result, currentRefFontSize) => {
		return result
			.map((sentence, id) => sentence.split(" "))
			.map((words, id) => {
				let bgColor = this.lineColors[id % this.lineColors.length];
				return words.map((word, index) => {
					let isFirstWord = index === 0;
					let isLastWord = index + 1 === words.length;
					let orator = this.document.createElement("orator");
					orator.classList.add(`orator-sentence-${id + 1}`);
					orator.textContent = `${word} `;
					orator.style.cssText = `
                        background-color: ${bgColor};
                        line-height: ${parseInt(currentRefFontSize) * 1.4}px;
                        border-bottom: 1px solid #00000070;
                        ${
							isFirstWord
								? "border-bottom-left-radius: 5px; border-top-left-radius:5px; padding-left:5px"
								: ""
						}
                        ${
							isLastWord
								? "border-bottom-right-radius: 5px; border-top-right-radius:5px; padding-right:5px; margin-right:5px"
								: ""
						}
                    `;
					return orator;
				});
			});
	};

	appendCloneToPage(result, callback) {
		// this.currentRef.before(...result.flat());
		// this.clone = this.currentRef.cloneNode(true);

		this.clone.innerHTML = "";
		this.clone.append(...result.flat());
		this.clone.classList.add(`orator-block`);
		this.currentRef.before(this.clone);
		let getCurrentRefStyles = this.window.getComputedStyle(this.currentRef);
		this.currentRefDisplay = getCurrentRefStyles.getPropertyValue("display");
		this.currentRef.style.display = "none";
		this.clone.scrollIntoViewIfNeeded(false);
		callback(this.textContent);
	}

	removeCloneFromPage() {
		const clones = this.document.getElementsByClassName(`orator-block`);
		if (clones.length) {
			for (let clone of clones) clone.parentElement.removeChild(clone);
		}

		if (
			this.document.body.contains(this.currentRef) &&
			this.currentRefDisplay !== "none"
		) {
			this.currentRef.style.display = this.currentRefDisplay;
		}
		// if (this.document.body.contains(this.clone)) {
		// 	// this.clone.style.display = "none";
		// 	this.clone.parentElement.removeChild(this.clone);
		// }
	}
}

export default Navigator;
