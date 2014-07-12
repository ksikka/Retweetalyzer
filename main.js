
var templates = {
    tweet: _.template('<div class="col-md-6"><div class="tweet-group">' +
                      '<div class="retweet-sect">' +
                          '<h4>Retweeted by (<%- retweet_count %>):</h4>' +
                          '<div class="retweet-heads"><%= retweet_sect_html %></div>' +
                      '</div>' +
                      '<div class="content-sect">' +
                          '<h4><%- subheading %></h4>' +
                          '<p><%- content %></p>' +
                      '</div>' +
                      '</div></div>'
                     ),
    rt_head: _.template('<a href="#"><img src="<%- url %>"></a>')
};

var processing = false;
var tweets;

var showSomeTweets = function() {
    $('#results').html('');
    var yo = 'http://pbs.twimg.com/profile_images/3723558553/544590203f86a1bfe67d5af1155b2391_normal.jpeg';
    _.each(tweets, function(t, i) {
        var data = {
            subheading: 'idk',
            content: t.text,
            retweet_count: t.retweet_count,
            retweet_sect_html: _.map([{ url: yo}, {url: yo}], templates.rt_head).join('')
        };
        $('#results').append(templates.tweet(data));
    })
};

var run = function() {

    var $submitButton = $('#tweet_handle_form button[type="submit"]');
    $submitButton.addClass('disabled');
    processing = true;
    $.ajax({
        dataType: 'json',
        url: 'data.json',
        success: function(data) {
            tweets = data; // TODO should prolly check if this is for real.

            showSomeTweets();

            processing = false;
            $submitButton.removeClass('disabled');
        }
    });
}

$('document').ready(function() {

    run(); // for testing css

    $('#tweet_handle_form').submit(function(e) {
        e.preventDefault();
        if (!processing) {
            run();
        }
    });
});
