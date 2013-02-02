/**
 * User: AustinFloyd
 * Date: 1/21/13
 * Time: 8:29 PM
 */

(function ($) {
	$(function () {
		var $totalVotes;
		var socket = Contest.io = io.connect();

		socket.on('connect', function () {
			if (typeof console !== 'undefined') console.log('connected');
			$('.beer-btn').click(function () {
				var $btn = $(this);
				socket.emit('vote', $btn.data('name'));
				return false;
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
		}).on('disconnect', function () {
		  	if (typeof console !== 'undefined') console.log('disconnected from server');
		});
		$totalVotes = $('#total-votes');
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