/**
 * User: AustinFloyd
 * Date: 1/21/13
 * Time: 8:29 PM
 */

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
			console.log('new val', $chatPane.val().replace(regex, ''));
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
					console.log(response);
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
					console.log('unhandled error: ', reasons);
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