var templates = {
    filter_input: [
'          <p>',
'            <select class="filter-data-include form-control">',
'              <option>Only show</option>',
'              <option>Hide</option>',
'            </select>',
'          retweets where',
'            <select class="filter-data-field form-control code-font">',
'              <option>user.description</option>',
'              <option>user.screen_name</option>',
'            </select>',
'',
'            <select class="filter-data-operation form-control">',
'              <option>contains</option>',
'              <option>is exactly</option>',
'            </select>',
'',
'            <input class="filter-data-datavalue form-control" size="10" type="text" placeholder="some text"/>',
'',
'            <button class="form-control btn btn-primary glyphicon glyphicon-plus filter-add-button"></button>',
'          </p>',
'      </div>'].join('\n'),
    filter_list_item: _.template([
'                      <tr id="filter-listing-<%- id %>">',
'                          <td><%- toIncludeStr %> retweets where <code>user.<%- field %></code> <%- operation %> <%- data %></td>',
'                          <td><button type="button" class="btn btn-danger btn-xs pull-right glyphicon glyphicon-remove filter-remove-button" data-filter-id="<%- id %>"></button></td>',
'                      </tr>',].join('\n')),
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
    rt_head: _.template('<a target="_blank" href="https://twitter.com/<%- user.screen_name %>"><img src="<%- user.profile_image_url %>"></a>')
};

/* tweets are the list of tweet objects returned from the timeline api */
/* retweets are a list of retweet lists. ith retweet list corresponds to ith original tweet with nonzero retweet count. */
var tweets, retweet_data;
/* in a tweet/retweet object, there's a little attribute called _state, this is an object completely application controlled, not given by the API. */

var retweetFilters = [];
//retweetFilters.push({predicate_fn:function(thing) { return thing.user.screen_name.indexOf('imran') === 0; }}); // XXX for testing

var constructFilter = function(toIncludeOrExclude, field, operation, data) {
    var filter = {
        toInclude: toIncludeOrExclude,
        toIncludeStr: toIncludeOrExclude ? 'Only show' : 'Hide',
        field: field,
        id: String(Number(new Date())),
        operation: operation,
        data: data,
        predicate_fn: function(thing) {
            if (operation === 'contains') {
                if (thing.user[field].toLowerCase().indexOf(data.toLowerCase()) !== -1)
                    return true;
            } else if (operation === 'is exactly') {
                if (thing.user[field].toLowerCase() === data.toLowerCase())
                    return true;
            } else {
                alert('oops: '+operation);
            }
        }
    };
    return filter;
};

var addFilter = function(filter) {
    retweetFilters.push(filter);
    _.each(retweet_data, function(rt_list) { applyFilters(rt_list, retweetFilters) });
    $('#filter-list tbody').append(templates.filter_list_item(filter));
    renderResults();
};

var removeFilter = function(filter) {
    var index = retweetFilters.indexOf(filter);
    $('#filter-listing-'+filter.id).remove();
    retweetFilters.splice(index, 1);
    _.each(retweet_data, function(rt_list) { applyFilters(rt_list, retweetFilters) });
    renderResults();
};

var bindFilterUIEvents = function() {
    $('#filter-entry-area').delegate('.filter-add-button', 'click', function() {
        var includeIndex = $('select.filter-data-include')[0].selectedIndex;
        var fieldIndex = $('select.filter-data-field')[0].selectedIndex;
        var operationIndex = $('select.filter-data-operation')[0].selectedIndex;
        var dataValue = $('input.filter-data-datavalue').val();

        var filter = constructFilter([true, false][includeIndex],
                                     ['description','screen_name'][fieldIndex],
                                     ['contains', 'is exactly'][operationIndex],
                                     dataValue);
        addFilter(filter);
    });
    $('#filter-list').delegate('.filter-remove-button', 'click', function() {
        var filterId = String($(this).data('filter-id'));
        var filter = _.findWhere(retweetFilters, { id: filterId });
        removeFilter(filter);
    });
};

var renderFilterInput = function() {
    $('#filter-entry-area').html(templates.filter_input);
};

/* Pseudo filters in that we OR the predicates, and if no filters, then all activated. */
var applyFilters = function(collection, filters) {
    if (filters.length === 0) {
        _.each(collection, function(thing) {
            thing._state.activated = true;
        });
    } else {
        _.each(collection, function(thing) {
            var filter;
            var to_activate = true;
            for (var i = 0; i < filters.length; i ++) {
                filter = filters[i];
                if (filter.predicate_fn(thing)) {
                    to_activate = filter.toInclude;
                    break;
                } else {
                    if (filter.toInclude) {
                        to_activate = false;
                        break;
                    }
                }
            }
            thing._state.activated = to_activate;
        });
    }
};



/* For each tweet, if it passes all filters,
 *   render tweet (light blue outline div)
 *   For each retweet, if it passes all filters,
 *     render retweet heads (image heads inside div)
 *     count ++
 *   Render retweet count
 */
var renderResults = function() {
    $('#results').html('');

    var retweet_index = -1;
    _.each(tweets, function(t, i) {
        // t.retweeted actually means that this is not an original tweet, but a retweet by current users.
        // so we check the negation to see if it's an original and retweeted by others.
        var retweet_html = '';
        var retweet_count = 0;

        if (!t.retweeted && t.retweet_count > 0) {
            retweet_index ++;
            var retweets = retweet_data[retweet_index];
            var rt_count_offset = t.retweet_count - retweets.length;
            //if (rt_count_offset > 0) alert('yo');
            retweets = _.filter(retweets, function(rt) { return rt._state.activated; });
            retweet_count = retweets.length + rt_count_offset;
            retweet_html = _.map(retweets, templates.rt_head).join('');
        }
        var data = {
            content: t.text,
            retweet_count: retweet_count,
            retweet_sect_html: retweet_html
        };
        $('#results').append(templates.tweet(data));
        is_original_and_retweeted_by_others = false;
    })
};


var processing = false;
var run = function() {

    var $submitButton = $('#tweet_handle_form button[type="submit"]');
    var username = $('#tweet_handle_form input[type="text"]').val();
    if (username === '') {
        alert('Please enter your twitter username');
        return;
    }
    $submitButton.addClass('disabled');
    processing = true;


    $.ajax({
        dataType: 'json',
        url: '/'+username+'/data.json',
        success: function(data) {
            tweets = data; // TODO should prolly check if this is for real.

            $.ajax({
                dataType: 'json',
                url: '/'+username+'/retweet_data.json',
                success: function(data2) {
                    retweet_data = data2; // TODO should prolly check if this is for real.
                    _.each(retweet_data, function(rt_list) {
                        _.each(rt_list, function(rt) {
                            rt._state = { activated: true };
                        });
                    });

                    renderResults();

                    processing = false;
                    $submitButton.removeClass('disabled');
                }
            });
        }
    });

}

$('document').ready(function() {

    renderFilterInput();
    bindFilterUIEvents();
    //run(); // for testing css

    $('#tweet_handle_form').submit(function(e) {
        e.preventDefault();
        if (!processing) {
            run();
        }
    });
});
