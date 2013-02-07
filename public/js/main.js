/**
 * User: AustinFloyd
 * Date: 1/21/13
 * Time: 8:29 PM
 */
var beerDescriptions = {
	'Lagunitas IPA': 'The IPA is Lagunitas Brewing Company\'s flagship beer; it is described as moderately hoppy and ' +
			'well balanced. Copious Cascade and Centennial hops with Crystal malt. "An IPA built to make you want ' +
			'another sip."[9] On the bottle label: "Thanks for choosing to spend the next few minutes with this ' +
			'special homicidally hoppy ale. Savor the moment as the raging hop character engages the Imperial ' +
			'Qualities of the Malt Foundation in mortal combat on the battlefield of your palate!"',
	'Stella Artois': "Stella Artois (pron.: /ˈstɛlə ɑrˈtwɑː/), informally called Stella, is a 5.2% ABV lager beer " +
			"brewed in Leuven, Belgium, since 1926. A lower alcohol content (4% ABV) version is also sold " +
			"in the UK, Republic of Ireland, Canada and New Zealand.[1] Stella Artois is one of the " +
			"prominent brands of Anheuser-Busch InBev, the world's largest brewer.",
	'Widmer Hefeweisen': "A cloudy brew with high quality wheat. It's bold, clean flavor and pronouced citrus and " +
			"floral aromas are what define American-style hefeweizen. Usually garnished with a lemon.",
	'Newcastle Brown Ale': 'Available filtered and pasteurised in keg and bottle. Newcastle Brown Ale was first ' +
			'brewed in 1927 in Newcastle-upon-Tyne, England, by Jim Porter after three years of development. ' +
			'Production moved from Newcastle to Gateshead at the end of 2004 and to Tadcaster on closure of the ' +
			'Dunston brewery in 2010. ',
	'Sierra Nevada Pale Ale': 'Sierra Nevada Pale Ale is a delightful example of the classic pale ale style. It has ' +
			'a deep amber color and a exceptionally full-bodied, complex character. The fragrant bouquet and spicy ' +
			'flavor are the results of the generous use of the best Cascade hops.',
	'Guiness Stout': 'Guinness (pron.: /ˈɡɪnɨs/ gin-is) is a popular Irish dry stout that originated in the brewery of ' +
			'Arthur Guinness (1725–1803) at St. James\'s Gate, Dublin. A feature of the product is the burnt flavour ' +
			'that is derived from roasted unmalted barley, although this is a relatively modern development, not ' +
			'becoming part of the grist until the mid-20th century. The draught beer\'s thick, creamy head comes ' +
			'from mixing the beer with nitrogen when poured. It is popular with Irish people both in Ireland and abroad'
};

(function ($) {
	$(function () {
		var $totalVotes = $('#total-votes'),
			$usersOnline = $('#users-online'),
			socket = Contest.io = io.connect('/', { 'connect timeout': 5000 }),
			vote = Contest.vote = io.connect('/vote', { 'connect timeout': 5000 }),
			alias,
			$alias = $('#alias'),
			$aliasSet = $('#alias-set'),
			$aliasDisplay = $('#alias-display'),
			$aliasName = $('#alias-name'),
			$aliasChange = $('#alias-change'),
			$chatMessage = $('#chat-message'),
			$chatSend = $('#chat-send'),
			$chatPane = $('#chat-pane');

		socket.on('connect', function () {
			log('connected');
			$('#online-status').hide();

			if (alias && alias.length) { setAlias(); } //In case of disconnect while on page
		}).on('connect_failed', function () {
		   log('disconnected from server');
		   $('#online-status').html('client or server error, cannot connect');
		}).on('disconnect', function () {
		  	log('disconnected from server');
		  	$('#online-status').html('disconnected from server');
		}).on('users online', function (count) {
			$('#users-online').html(count);
	  	}).on('page views', function (count) {
			$('#page-views').html(count);
		}).on('alias set', function () {
			$aliasName.html('Alias: ' + alias);
			$aliasDisplay.show();
			$alias.parent().hide();
			$('#chat-input').show();
		    $chatMessage.focus();
		}).on('chat message', function (message) {
			$chatPane.val($chatPane.val() + message);
			var textarea = $chatPane[0];
		    textarea.scrollTop = textarea.scrollHeight;
			$chatMessage.val('');
		}).on('clean messages', function (regex) {
			regex = new RegExp(regex, 'g');
			log('new val', $chatPane.val().replace(regex, ''));
			$chatPane.val($chatPane.val().replace(regex, ''));
		}).on('clear all', function () {
			$chatPane.val('...sorry had to clear messages...\n');
		});

		socket.on('vote update', function (message) {
			var className = message.name.replace(/ /g, '').toLowerCase();
			var maxVote = 0, totalVotes = 0;
			$('.vote-num').each(function (key, elem) {
				var $elem = $(elem);
				if ($elem.hasClass(className)) {
					var voteNum = message.votes;
					$elem.html(voteNum);
					totalVotes += voteNum;
					return voteNum > maxVote ? (maxVote = voteNum) : '';
				}

				var voteNum = parseInt($elem.text());
				totalVotes += voteNum;
				voteNum > maxVote ? (maxVote = voteNum) : '';
			}).each(function (key, elem) {
				var $elem = $(elem);
				var voteNum = parseInt($elem.text());
				$elem.siblings('.progress').children('.bar').css('width', voteNum/maxVote*100 + '%');
			});

			$totalVotes.html(totalVotes);
		});

		vote.on('connect', function () {
			$('#vote-status').remove();
			log('connected to /vote');
			var hasVoted = $('.beer-btn').data('alreadyVoted');
			$('.beer-btn').addClass(!hasVoted ? 'btn-success' : '').unbind().click(function () {
				var $btn = $(this);
				log('casting vote for' + $btn.data('name'));
				vote.emit('cast vote', $btn.data('name'));
				return false;
			});
		}).on('already voted', function (message) {
			$('.btn').removeClass('btn-success');
			$('#vote-message').html(message).show().css('background-color', 'yellow');
			setTimeout(function () {
				$('#vote-message').hide().css('background-color', 'inherit');
			}, 15000);
		}).on('thanks', function (message) {
			$('.btn').removeClass('btn-success');
			$('#vote-message').html(message).show().css('background-color', 'yellow');
		}).on('connect_failed', function () {
			log('connect to /vote failed');
			$('.beer-btn').unbind().click(function () {
				$('#vote-message').html('You must be logged in to vote, log in above').show();
				setTimeout(function () {
					$('#vote-message').hide();
				}, 5000);
				return false;
			});
		});

		$aliasSet.click(setAlias);
		$alias.keypress(function (e) {
			if (e.which === 13) { setAlias(); }
		});
		function setAlias() {
			var aliasEntered = $alias.val();
			if (aliasEntered.length) {
				socket.emit('set alias', aliasEntered);
				alias = aliasEntered;
			}
		}
		$chatSend.click(sendChat);
		$chatMessage.keypress(function (e) {
			if (e.which === 13) { sendChat(); }
		});
		function sendChat() {
			var messageEntered = $chatMessage.val();
			if (messageEntered.length) {
				socket.emit('send message', messageEntered);
			}
		}

		$aliasChange.click(function () {
			$alias.parent().show();
			$('#chat-input').hide();
			$alias.focus();
		});

		$alias.focus();

		$('.info-link').click(function () {
			window.open($(this).data('url'), '_blank');
		}).each(function (key, elem) {
			var $link = $(elem);
			$link.popover({
				title: $link.data('name'),
				trigger: 'hover',
				content: beerDescriptions[$link.data('name')] + ' Click to read more in another window!'
			});
		});

		var $reCaptcha = $('#recaptcha');
		$('#use-captcha').click(function () {
			$(this).hide();

			$('#recaptcha-area').show();
			var $captchaResponseField = $('#recaptcha_response_field').focus(),
				$captchaChallengeField = $('#recaptcha_challenge_field');
			$captchaResponseField.keypress(function (e) {
				if (e.which === 13) {
					checkCaptcha();
				}
			});
			$('#recaptcha-submit').click(function () {
				checkCaptcha();
			});
			var $recaptchaError = $('#recaptcha-error');
			function checkCaptcha() {
				$recaptchaError.hide();
				Contest.ajax('captcha', {
					url: 'auth/captcha',
					data: {challenge: $captchaChallengeField.val(), answer: $captchaResponseField.val() },
					type: 'POST'
				}).done(function (response) {
					log(response);
					if (response.isValid) {
						window.location.href = '/';
					} else if (response.html) {
						$('#recaptcha-error').show().html(response.html);
					}
					else {
						$recaptchaError.show();
						//Recaptcha.reload();

					}
				}).fail(function (reasons) {
					log('unhandled error: ', reasons);
				});
			}
		});

		handleTopNavStyle();
	});

	function handleTopNavStyle() {
		var $window = $(window),
			$topNav = $('#top-nav');

		$topNav.toggleClass('no-fix', $window.width() < 1000);
		$window.resize(function (e) {
			$topNav.toggleClass('no-fix', $window.width() < 1000);
		});
	}
})(jQuery);

function log() {
	if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
		console.log.apply(console, arguments);
	}
}