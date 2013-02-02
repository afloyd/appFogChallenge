window.Contest = (function($) {
	function Contest() {
		this._templates = {};
		this._eventHandlers = {};
		this.data = {};
		this._data = {};
	}

	/**
	 * Primary method for communication with the server. Pass the element (usually form) that you want events triggered
	 * on, along with the name for the trigger. This method just returns a promise which exposes done() & fail(). This
	 * method handles AJAX error events, and will only send response reasons to the fail() method. The done() method
	 * will receive the response data. The caller is responsible for firing the success event, but error & warn events
	 * will be automatically triggered
	 * @param triggerName	{String}	The name for event triggers (ie login.success would be just 'success')
	 * @param opts			{Object}	AJAX options. dataType will be overwritten to 'json'
	 * @return 				{promise}	Deferred.promise for response data events
	 */
	Contest.prototype.ajax = function(triggerName, opts) {
		var deferred = $.Deferred();
		opts || (opts = {});
		opts.dataType = 'json';

		$.ajax(opts)
				.done(function (response) {
					if (response.error) {
						deferred.reject(response);
						return window.Contest.$events.trigger(triggerName + '.fail', response.error);
					}
					if (!response.success) {
						deferred.reject(response.reason);
						return window.Contest.$events.trigger(triggerName + '.warn', response.reason);
					}

					deferred.resolve(response.data);
				})
				.fail(function (jqXHR, textStatus, errorThrown) {
					if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
						console.log(opts, jqXHR, textStatus, errorThrown);
					}

					window.Contest.$events.trigger(triggerName + '.fail', jqXHR, textStatus, errorThrown, opts);
					//Follow the 'normal' reason rejection pattern, this way individual requests don't have to handle it
					//and the handling can always be done the same here
					deferred.reject(['Unrecoverable error, please try again later']);
				});

		return deferred.promise();
	};

	//
	// Template-related methods
	//
	Contest.prototype.addTemplate = function(templateName, compiledTemplate) {
		if (this._templates[templateName]) throw new Error('A template with this name already exists! Template name: ' + templateName);
		this._templates[templateName] = compiledTemplate;
	};

	Contest.prototype.render = function(templateName, locals) {
		var template = Contest._templates[templateName];
		return template(locals);
	};

	$(function () {
		Contest.prototype.$contentPane = $('#content-pane');
		Contest.prototype.$events = $(document);
	});

	return new Contest();
})(jQuery);
