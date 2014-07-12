
var templates = {
    tweet: _.template('<div class="col-md-6"><div class="tweet-group">' +
                      '<div class="retweet-sect">' +
                          '<h4>Retweeted by (<%- retweet_count %>):</h4>' +
                          '<div class="retweet-heads"><%= retweet_sect_html %></div>' +
                      '</div>' +
                      '<div class="content-sect">' +
                          '<p><%- content %></p>' +
                      '</div>' +
                      '</div></div>'
                     ),
    rt_head: _.template('<a href="#"><img src="<%- user.profile_image_url %>"></a>')
};

var processing = false;
var tweets, retweet_data;

var renderResults = function() {
    $('#results').html('');

    var retweet_index = -1;
    _.each(tweets, function(t, i) {
        // t.retweeted actually means that this is not an original tweet, but a retweet by current users.
        // so we check the negation to see if it's an original and retweeted by others.
        var retweet_html = '';
        if (!t.retweeted && t.retweet_count > 0) {
            retweet_index ++;
            retweet_html = _.map(retweet_data[retweet_index], templates.rt_head).join('')
        }
        var data = {
            content: t.text,
            retweet_count: t.retweet_count,
            retweet_sect_html: retweet_html
        };
        $('#results').append(templates.tweet(data));
        is_original_and_retweeted_by_others = false;
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

            $.ajax({
                dataType: 'json',
                url: 'retweet_data.json',
                success: function(data2) {
                    retweet_data = data2; // TODO should prolly check if this is for real.

                    renderResults();

                    processing = false;
                    $submitButton.removeClass('disabled');
                }
            });
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
