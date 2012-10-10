/*
UI functions dedicated to the Meetup modal panel
*/

var meetup_api_group = 'https://api.meetup.com/2/groups?';
var meetup_api_events = 'https://api.meetup.com/2/events?';
var meetup_key = 'key=';
var signed = '&sign=true';
var group_url = '&group_urlname=';
var meetup_api_json = '.json';

var spinner = (new Spinner(spin_opts)).spin();
var template = null;
var url = null;
var meetup_data = {};

$('a[id^="meetup-link"]').click(function (e)
{
    var url = prepare_link(e, this);
    adjustSelection("meetup-link");
    remove_modal();
    showMeetup(url, this);
});

function showMeetup(e, t) {
    url = t.href;
    var meetup_profile = $("#meetup-profile");
    if (meetup_profile.length > 0) {
        meetup_profile.modal('show');
    }
    else {
        $("#meetup-link").append(spinner.el);

        $.get('/theme/templates/meetup-view.html', function(data) {
            // Request succeeded, data contains HTML template, we can load data
            template = Handlebars.compile(data);
            var user_url = meetup_api_group+meetup_key+meetup_api_key+signed+group_url+group_urlname;

            try {
                $.ajax({
                    url: user_url,
                    dataType: "jsonp",
                    jsonpCallback: "readMeetupData",
                    error: function(s, statusCode, errorThrown) {
                        window.location.href = url;
                        spinner.stop();
                    }
                });
            }
            catch (err) {
                window.location.href = url;
                spinner.stop();
            }
        })
        .error(function() {
            window.location.href = url;
            spinner.stop();
        });
    }
}

function readMeetupData(results) {
    try {
        results.results[0].name = numberWithCommas(results.results[0].name);
        results.results[0].rating = numberWithCommas(results.results[0].rating);
        results.results[0].description = meetupLinkify(results.results[0].description);
        meetup_data['group'] = results.results[0];

        var events_url = meetup_api_events+meetup_key+meetup_api_key+signed+group_url+group_urlname;
        $.ajax({
            url: events_url,
            dataType: "jsonp",
            jsonpCallback: "readEvents",
            error: function(s, statusCode, errorThrown) {
                window.location.href = url;
                spinner.stop();
            }
        });
    }
    catch (err) {
        window.location.href = url;
        spinner.stop();
    }
}

function readEvents(events) {
    try {
        console.log(events.results)
        for(var index = 0 ; index < events.results.length ; index++) {
            var event_x = events.results[index];
            event_x.formated_date = moment(event_x.time).fromNow();
            event_x.text = meetupLinkify(event_x.description);
        }
        meetup_data['events'] = events.results;
        console.log(meetup_data)
        
        var html = template(meetup_data);
        $('body').append(html);
        $("#meetup-profile").modal();
        spinner.stop();
    }
    catch (err) {
        window.location.href = url;
        spinner.stop();
    }
}

function meetupLinkify(e) {
    return e = e.replace(/(https?:\/\/\S+)/gi, function (e) {
        return '<a href="' + e + '">' + e + "</a>"
    }), e = e.replace(/(^|) @(\w+)/gi, function (e) {
        return '<a href="http://twitter.com/' + e + '">' + e + "</a>"
    }), e = e.replace(/(^|) #(\w+)/gi, function (e) {
        return '<a href="http://search.twitter.com/search?q=' + e.replace(/#/, "%23") + '">' + e + "</a>"
    }), e
}