var url = require("url"),
	_ = require("lodash"),
	should = require("should"),
	EventEmitter = require("events").EventEmitter;


var cookies = [],
	historyArr = [],
	localStorage = {},
	emitter = new EventEmitter();

// This needs to be defined so an error doesn't occur in the UMD loader
global.window = null;

var envs = {
	modern: {
		localStorage: {
			getItem: function(key) {
				if (localStorage[key]) {
					return localStorage[key];
				}
				else {
					return null;
				}
			},

			setItem: function(key, value) {
				localStorage[key] = value;
			}
		},

		history: {
			pushState: function(state, title, url) {
				historyArr.unshift({
					href: url,
					state: state,
					title: title
				});

				emitter.emit("popstate", { state: state });
			},

			replaceState: function(state, title, url) {
				historyArr[0] = {
					href: url,
					state: state,
					title: title
				};

				emitter.emit("popstate", { state: state });
			},

			back: function() {
				historyArr.shift();

				emitter.emit("popstate", { state: historyArr[0].state });
			},

			get state() {
				return historyArr[0].state;
			}
		},

		document: {
			addEventListener: function(evt, cb) {
				emitter.on(evt, cb);
			}
		},

		title: "Page Title",

		attachEvent: undefined,

		addEventListener: function(evt, cb) {
			emitter.on(evt, cb);
		}
	},

	ancient: {
		history: {
			back: function() {
				if (historyArr[0].hash !== historyArr[1].hash) {
					var oldUrl = historyArr[1].href,
						newUrl = historyArr[0].href;

					historyArr.shift();

					testEnv.location.parsed = historyArr[0];

					emitter.emit("hashchange", {
						oldUrl: oldUrl,
						newUrl: newUrl
					});
				}
				else {
					historyArr.shift();

					testEnv.location.parsed = historyArr[0];
				}
			},
		},

		location: {
			// This is the cached output from Node's url.parse()
			parsed: {
				auth: null,
				port: null,
				slashes: true,
				protocol: "http:",
				pathname: "/page",
				host: "localhost",
				hostname: "localhost",
				query: "with=a-parameter",
				search: "?with=a-parameter",
				path: "/page?with=a-parameter",
				hash: "#this-will-be-clobbered-if-using-the-mobile-ancient-browser-method",
				href: "http://localhost/page?with=a-parameter#this-will-be-clobbered-if-using-the-mobile-ancient-browser-method"
			},

			get hash() {
				return this.parsed.hash;
			},

			set hash(val) {
				// If the parsed object isn't cloned then updating the hash changes
				// historyArr resulting in an incorrect test failure
				this.parsed = _.clone(this.parsed);

				this.parsed.hash = val;

				this.parsed = url.parse(url.format(this.parsed));

				// Nonexistent hashes should be empty strings, not null
				if (!this.parsed.hash) {
					this.parsed.hash = "";
				}

				historyArr.unshift(this.parsed);
			},

			replace: function(link) {
				var oldUrl = this.parsed.href,
					newUrl = url.resolve(this.parsed.href, link);

				var parsed = url.parse(newUrl);

				if (parsed.hash !== this.hash) {
					this.parsed = historyArr[0] = parsed;

					emitter.emit("hashchange", {
						oldUrl: oldUrl,
						newUrl: newUrl
					});
				}
				else {
					this.parsed = historyArr[0] = parsed;
				}
			}
		},

		document: {
			get cookie() {
				return _.map(cookies, function(e) { return e.join("="); }).join(";");
			},

			set cookie(cookie) {
				var cookie = (cookie.toString().split(";")[0] || "").split("=");

				cookies.push([cookie.shift(), cookie.join("=")]);

				cookies = _.uniq(cookies, 0);
			},

			attachEvent: function(evt, cb) {
				emitter.on(evt.substr(2), cb);
			}
		},

		onhashchange: null,

		title: "Page Title",

		attachEvent: function(evt, cb) {
			emitter.on(evt.substr(2), cb);
		}
	},

	mobile: {
		navigator: {
			userAgent: "Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Mobile Safari/535.19"
		}
	},

	desktop: {
		navigator: {
			userAgent: "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
		}
	}
};


var reset = function() {
	cookies = [];
	historyArr = [];
	localStorage = {};
	
	emitter.removeAllListeners();

	global.Bounceback = null;

	delete require.cache[require.resolve("../lib/bounceback.js")];

	global.Bounceback = require("../lib/bounceback.js");
};

var core = function() {
	describe("Should succeed core tests", function() {
		before(function() {
			cookies = [];
			historyArr = [];
			localStorage = {};
			
			emitter.removeAllListeners();

			global.Bounceback = null;

			delete require.cache[require.resolve("../lib/bounceback.js")];

			global.Bounceback = require("../lib/bounceback.js");
		});

		it("should exist", function() {
			should.exist(Bounceback);
		});

		it("should have public API methods", function() {
			should.exist(Bounceback.init);
			should.exist(Bounceback.activate);
			should.exist(Bounceback.enable);
			should.exist(Bounceback.disable);
			should.exist(Bounceback.noConflict);
			should.exist(Bounceback.onBounce);
		});

		it("should have a default onBounce handler that returns `this`", function() {
			should.exist(Bounceback.options.onBounce);
			
			Bounceback.options.onBounce().should.equal(Bounceback);
		});

		it("should not be active", function() {
			Bounceback.activated.should.be.false;
		});

		it("should initialize correctly", function() {
			Bounceback.init({
				maxDisplay: 2,
				cookieLife: 1,
				method: "auto",
				storeName: "testStoreName"
			}).activated.should.be.true;
		});

		it("should have set a cookie in storage", function() {
			Bounceback.data.get("testStoreName").should.equal("1");
		});

		it("should disable correctly", function() {
			Bounceback.disable().disabled.should.be.true;
		});

		it("should enable correctly", function() {
			Bounceback.enable().disabled.should.be.false;
		});

		it("should restore the old Bounceback variable when noConflict is called and return itself", function() {
			testEnv.Bounceback = "test";

			Bounceback.noConflict();

			// noConflict restores the value of root.Bounceback to what it was, undefined
			// 
			// Since root in the testing environment is separate from where Bounceback is
			// defined it doesn't erase itself while doing this.
			should(testEnv.Bounceback).equal(undefined);
		});
	});
};

var desktop = function() {
	describe("Should succeed desktop tests", function() {
		before(function() {
			cookies = [];
			historyArr = [];
			localStorage = {};
			
			emitter.removeAllListeners();

			global.Bounceback = null;

			delete require.cache[require.resolve("../lib/bounceback.js")];

			global.Bounceback = require("../lib/bounceback.js");

			Bounceback.init();
		});

		core();

		it("should be listening for mouse events", function() {
			emitter.listeners("mousemove").should.have.a.lengthOf(1);
			emitter.listeners("mouseout").should.have.a.lengthOf(1);
			emitter.listeners("scroll").should.have.a.lengthOf(1);
		});

		it("should not attach new listeners when initialize is called more than once", function() {
			Bounceback.init();
			Bounceback.init();

			emitter.listeners("mousemove").should.have.a.lengthOf(1);
			emitter.listeners("mouseout").should.have.a.lengthOf(1);
			emitter.listeners("scroll").should.have.a.lengthOf(1);
		});

		it("should trigger when the mouse moves outside the viewport and fits the parameters", function() {
			var called = 0;

			Bounceback.init({
				onBounce: function() {
					called++;
				}
			});

			emitter.emit("mousemove", { clientX: 1120, clientY: 279 });
			emitter.emit("mousemove", { clientX: 1120, clientY: 278 });
			emitter.emit("mousemove", { clientX: 1121, clientY: 276 });
			emitter.emit("mousemove", { clientX: 1124, clientY: 273 });
			emitter.emit("mousemove", { clientX: 1129, clientY: 266 });
			emitter.emit("mousemove", { clientX: 1141, clientY: 251 });
			emitter.emit("mousemove", { clientX: 1167, clientY: 224 });
			emitter.emit("mousemove", { clientX: 1211, clientY: 173 });
			emitter.emit("mousemove", { clientX: 1266, clientY: 111 });
			emitter.emit("mousemove", { clientX: 1331, clientY: 38 });

			emitter.emit("mouseout", {
				toElement: {
					nodeName: "HTML"
				},
				clientY: 80
			});

			called.should.equal(1);
		});

		it("should disable if triggered immediately after scrolling", function() {
			var called = 0;

			Bounceback.init({
				onBounce: function() {
					called++;
				}
			});

			emitter.emit("scroll");

			emitter.emit("mouseout", {
				toElement: {
					nodeName: "HTML"
				},
				clientY: 80
			});

			called.should.equal(0);
			Bounceback.disabled.should.be.true;

			// If this isn't re-enabled later tests will fail because the trigger will still be blocked
			Bounceback.disabled = false;
		});

		it("should trigger up to the number of times specified in the options", function() {
			Bounceback.init({ maxDisplay: 3 });

			var called = 0;

			Bounceback.init({
				onBounce: function() {
					called++;
				}
			});

			emitter.emit("mouseout", {
				toElement: {
					nodeName: "HTML"
				},
				clientY: 80
			});

			emitter.emit("mouseout", {
				toElement: {
					nodeName: "HTML"
				},
				clientY: 80
			});

			called.should.equal(2);
		});
	});
};


describe("Should work in older desktop environments", function() {
	before(function() {
		global.testEnv = _.assign({}, envs.desktop, envs.ancient);

		reset();
	});

	desktop();
});

describe("Should work in modern desktop environments", function() {
	before(function() {
		global.testEnv = _.assign({}, envs.desktop, envs.ancient, envs.modern);

		reset();
	});

	desktop();
});

describe("Should work in older mobile environments", function() {
	before(function() {
		cookies = [];
		localStorage = {};
		
		emitter.removeAllListeners();

		global.testEnv = _.assign({}, envs.mobile, envs.ancient);

		historyArr = [testEnv.location.parsed];

		global.Bounceback = null;

		delete require.cache[require.resolve("../lib/bounceback.js")];

		global.Bounceback = require("../lib/bounceback.js");

		Bounceback.init();
	});

	core();

	it("should set the hash on the page and duplicate it in the history", function() {
		historyArr.length.should.equal(2);

		historyArr[1].hash.should.equal("#bht");
	});

	it("should listen for hashchange events", function() {
		emitter.listeners("hashchange").length.should.equal(1);
	});

	it("should trigger when going back in the history", function() {
		var called = 0;

		Bounceback.init({
			onBounce: function() {
				called++;
			}
		});

		testEnv.history.back();

		called.should.equal(1);
	});
});

describe("Should work in modern mobile environments", function() {
	before(function() {
		global.testEnv = _.assign({}, envs.mobile, envs.ancient, envs.modern);

		reset();

		Bounceback.init();
	});

	core();

	it("should set the state and duplicate the page in history", function() {
		historyArr.length.should.equal(2);

		historyArr[1].state.isBouncing.should.be.true;
	});

	it("should not change the state of the current page", function() {
		should.not.exist(historyArr[0].state);
	});

	it("should trigger when going back in the history", function() {
		var called = 0;

		Bounceback.init({
			onBounce: function() {
				called++;
			}
		});

		testEnv.history.back();

		called.should.equal(1);
	});
});