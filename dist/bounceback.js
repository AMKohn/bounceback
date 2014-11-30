/**
 * Bounceback.js v1.0.0
 * 
 * Copyright 2014 Avi Kohn
 * Distributable under the MIT license
 */

(function(root, factory) {
	// The Istanbul comments stop the UMD from being counted in coverage reports
	
	// AMD
	/* istanbul ignore next */
	if (typeof define === "function" && define.amd) {
		define(function() {
			return factory(root, document, {});
		});
	}

	// Node.js and CommonJS, for testing
	else if (typeof exports !== "undefined") {
		// This is a test run, inject the test environment
		if (global && global.testEnv) {
			factory(global.testEnv, global.testEnv.document, exports);
		}
		/* istanbul ignore next */
		else {
			factory(root, document, exports);
		}
	}

	// Normal browser usage
	/* istanbul ignore next */
	else {
		root.Bounceback = factory(root, document, {});
	}

	// `root` and `doc` allow for better compression
})(window, function(root, doc, Bounceback) {
	/**
	 * Attaches an event to the window.
	 * 
	 * This could accept an element as an argument but that would make testing more difficult.
	 *
	 * @api    private
	 * @param  {Element}   elm The element to attach the event to
	 * @param  {String}    evt The name of the event to attach
	 * @param  {Function}  cb  The event callback
	 */
	var addEvent = function(elm, evt, cb) {
		if (elm.attachEvent) {
			elm.attachEvent("on" + evt, cb);
		}
		else {
			elm.addEventListener(evt, cb, false);
		}
	};


	// There isn't any other library called Bounceback that would use the
	// variable, but might as well
	var oldBounceback = root.Bounceback;

	/**
	 * Restores the Bounceback variable in the global scope to its previous value
	 *
	 * @return {Object} Bounceback
	 */
	Bounceback.noConflict = function() {
		root.Bounceback = oldBounceback;

		return this;
	};

	Bounceback.version = "1.0.0";

	Bounceback.options = {
		distance: 100, // The minimum distance in px from the top to consider triggering for
		maxDisplay: 1, // The maximum number of times the dialog may be shown on one page, or 0 for unlimited.  Only applicable when using the mouse based method
		method: "auto", // The bounce detection method
		sensitivity: 10, // The minimum distance the mouse has to have moved in the last 10 mouse events for onBounce to be triggered
		cookieLife: 365, // The cookie (when localStorage isn't available) expiry age, in days
		scrollDelay: 500, // The amount of time in ms that bouncing should be ignored for after scrolling, or 0 to disable
		aggressive: false, // Whether or not to ignore the cookie that blocks initialization unless it's the first pageview
		checkReferrer: true, // Whether or not to check the referring page to see if it's on the same domain and this isn't the first pageview
		storeName: "bounceback-visited", // The key to store the cookie (or localStorage item) under
		onBounce: function() { return Bounceback; } // The default onBounce handler
	};


	Bounceback.data = {
		/**
		 * Gets an item's value by key from storage
		 *
		 * @api    public
		 * @param  {String} key The key to retrieve the value from
		 * @return {String}     The retrieved value
		 */
		get: function(key) {
			if (root.localStorage) {
				return root.localStorage.getItem(key) || "";
			}
			else {
				var cookies = doc.cookie.split(";");

				var i = -1,
					data = [],
					cVal = "",
					cName = "",
					length = cookies.length;

				while (++i < length) {
					data = cookies[i].split("=");

					if (data[0] == key) {
						data.shift();

						return data.join("=");
					}
				}

				return "";
			}
		},


		/**
		 * Sets a key to the specified value in storage
		 *
		 * @api    public
		 * @param  {String} key   The key to store under
		 * @param  {String} value The value to store
		 * @return {Object}       The data store, for chained calls
		 */
		set: function(key, value) {
			if (root.localStorage) {
				root.localStorage.setItem(key, value);
			}
			else {
				var dt = new Date();

				dt.setDate(dt.getDate() + Bounceback.options.cookieLife);
				
				doc.cookie = key + "=" + value + "; expires=" + dt.toUTCString() + ";path=/;";
			}

			return this;
		}
	};


	var shown = 0;

	/**
	 * This proxies calls to onBounce to ensure that it isn't triggered
	 * more than the limit specified in the options allows
	 */
	Bounceback.onBounce = function() {
		shown++;

		/* istanbul ignore else */
		if (!this.options.maxDisplay || shown <= this.options.maxDisplay) {
			this.options.onBounce();
		}
	};


	/**
	 * Whether or not the current browser is mobile.
	 * 
	 * This is used to decide if the mouse or pushState method should be used.
	 *
	 * @type {Boolean}
	 */
	Bounceback.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(root.navigator.userAgent);


	/**
	 * Whether or not Bounceback is disabled, toggled by default on scroll
	 *
	 * @type {Boolean}
	 */
	Bounceback.disabled = false;


	/**
	 * Whether or not Bounceback has been activated.  This prevents activate
	 * from executing more than once
	 *
	 * @type {Boolean}
	 */
	Bounceback.activated = false;


	/**
	 * Disables Bounceback.
	 * 
	 * This does _not_ remove the event handlers since that would involve
	 * more complicated code to handle each of the handlers when only one
	 * would ever be attached at a given time.
	 *
	 * @api    public
	 * @return {Object} Bounceback
	 */
	Bounceback.disable = function() {
		this.disabled = true;

		return this;
	};


	/**
	 * Enables Bounceback
	 *
	 * @api    public
	 * @return {Object} Bounceback
	 */
	Bounceback.enable = function() {
		this.disabled = false;

		return this;
	};


	/**
	 * Attaches handlers as necessary and sets up Bounceback
	 */
	Bounceback.activate = function(method) {
		if (method == "history") {
			// The history API for modern browsers
			if ("replaceState" in root.history) {
				// Set data in the current state to let Bounceback know that it should
				// fire the onBounce handler
				root.history.replaceState({
					isBouncing: true
				}, root.title);

				// Then add a new state to the history so hitting back navigates to
				// the previous added state and fires onBounce
				root.history.pushState(null, root.title);

				// Handle popstate events
				addEvent(root, "popstate", function(e) {
					/* istanbul ignore else */
					if (root.history.state && root.history.state.isBouncing) {
						Bounceback.onBounce();
					}
				});
			}

			// And the hash for others
			/* istanbul ignore else */
			else if ("onhashchange" in root) {
				// BHT -> Bounceback Hash Trigger
				root.location.replace("#bht");

				root.location.hash = "";

				addEvent(root, "hashchange", function() {
					/* istanbul ignore else */
					if (root.location.hash.substr(-3) === "bht") {
						Bounceback.onBounce();
					}
				});
			}
		}
		else {
			var timer = null,
				movements = [],
				scrolling = false;


			addEvent(doc, "mousemove", function(e) {
				movements.unshift({
					x: e.clientX,
					y: e.clientY
				});

				movements = movements.slice(0, 10);
			});


			addEvent(doc, "mouseout", function(e) {
				/* istanbul ignore else */
				if (!Bounceback.disabled) {
					var from = e.relatedTarget || e.toElement;

					/* istanbul ignore else */
					if (
						(!from || from.nodeName == "HTML") && 
						e.clientY <= Bounceback.options.distance && 
						movements.length == 10 &&
						movements[0].y < movements[9].y &&
						movements[9].y - movements[0].y > Bounceback.options.sensitivity
					) {
						Bounceback.onBounce();
					}
				}
			});


			// While scrolling using the mouse if it leaves the body the mouseout event is
			// delayed until scrolling stops.  This ensures that the event fired then is ignored.
			/* istanbul ignore else */
			if (this.options.scrollDelay) {
				addEvent(root, "scroll", function(e) {
					/* istanbul ignore else */
					if (!Bounceback.disabled) {
						Bounceback.disabled = true;

						clearTimeout(timer);

						timer = setTimeout(function() {
							Bounceback.disabled = false;
						}, Bounceback.options.scrollDelay);
					}
				});
			}
		}
	};


	/**
	 * Initializes Bounceback.
	 * 
	 * Multiple calls will update options that are not already in use.
	 *
	 * @api    public
	 * @param  {Object} [options] Any options to initialize with
	 * @return {Object}           Bounceback
	 */
	Bounceback.init = function(options) {
		options = options || {};

		var key;

		for (key in this.options) {
			if (this.options.hasOwnProperty(key) && !options.hasOwnProperty(key)) {
				options[key] = this.options[key];
			}
		}

		this.options = options;

		if (options.checkReferrer && doc.referrer) {
			var a = doc.createElement("a");
			
			a.href = doc.referrer;

			if (a.host == root.location.host) {
				this.data.set(options.storeName, "1");
			}
		}

		if (!this.activated && (options.aggressive || !this.data.get(options.storeName))) {
			this.activated = true;

			if (options.method === "history" || (options.method === "auto" && this.isMobile)) {
				this.activate("history");
			}
			else {
				this.activate("mouse");
			}

			this.data.set(options.storeName, "1");
		}

		return this;
	};

	return Bounceback;
});