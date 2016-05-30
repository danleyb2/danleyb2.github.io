//load site data via ajax
var myLocation;
function updateSite(data) {
    var temp;

    //PROFILE
    temp = data['profile'];
    myLocation = temp['location']||{'latitude':0,'longitude':0};
    //update my name
    $('.my-name').text(temp['info']['first_name'] + ' ' + temp['info']['last_name']);
    $('.my-img').attr('src', temp['info']['icon']);

    //contact data
    $('.my-email').html('<a href="mailto:' + temp['contact']['email'] + '"></a>' + temp['contact']['email']);
    $('.my-phone').text(temp['contact']['phone']);
    $('.my-home').text(temp['contact']['home']);
    $('.my-address').text(temp['contact']['address']);
    //$('.my-home').text(data['']);


    $('.my-title').text(temp['title']);
    $('.my-intro').text(temp['info']['intro']);
    $('title').text(temp['name']);

    temp = data['services'] || [];
    for (var h = 0; h < temp.length; h++) {
        var si_data = temp[h];

        var si = '<li><a target="_blank" href="' + si_data['url']
            + '" class="' + si_data['icon']['css']
            + '" target="_blank" itemprop="url"></a></li>';

        $('.socialicons ul').append(si);
    }


    temp = data['timelines'] || [];
    for (var p = 0; p < temp.length; p++) {
        var timeline_data = temp[p];

        var timeline = '<h3 class="main-heading"><span>' + timeline_data['name'] + '</span></h3>' +
            '<ul class="timeline">';

        for (var j = 0; j < timeline_data['events'].length; j++) {
            var event = timeline_data['events'][j];
            console.log(event);
            timeline += '<li>' +
                '<div class="timelineUnit">' +
                '<h4><a href="http://www1.umn.edu/twincities/index.html/">' + event['place'] + '</a></h4>' +
                '<h5><a href="http://www.csom.umn.edu/">' + event['name'] + '</a><span class="timelineDate">' + event['start'] + ' ' + event['end'] + '</span></h5>' +
                '<p>' + event['description'] + '<br></p>' +
                '</div>' +
                '</li>';
        }

        timeline += '<div class="clear"></div>' +
            '</ul>';

        $('.timeline-section').append(timeline);
    }

    temp = data['technologies'] || [];
    for (var i = 0; i < temp.length; i++) {
        var skill_data = temp[i];

        var skill = '<li>' +
            '<h4>' + skill_data['name'] + '</h4>' +
            '<span class="rat' + skill_data['experience'] + '"></span>' +
            '</li>';

        $('.skills-section ul').append(skill);
    }

}

$.ajax({

    url: 'http://danleyb2.pythonanywhere.com/pa/site_data/',
    //url:'site_data.json',
    //data : { load : true, id : id },
    type: 'GET',
    dataType: 'json',
    //timeout: 1000,
    error: function (e) {
        console.log('site data load error');
        console.log(e);
    },
    success: function (data) {
        //console.log(data);
        updateSite(data['results'][0]);
    }
});

jQuery(document).ready(function () {

    /* ---------------------------------------------------------------------- */
    /*  Custom Functions
    /* ---------------------------------------------------------------------- */

    // Needed variables
    var $logo = $('#logo');

    // Show logo 
    $('.tab-resume,.tab-portfolio,.tab-contact').click(function () {
        $logo.fadeIn('slow');
    });
    // Hide logo
    $('.tab-profile').click(function () {
        $logo.fadeOut('slow');
    });

    /* ---------------------------------------------------------------------- */
    /*  Menu
    /* ---------------------------------------------------------------------- */

    // Needed variables
    var $content = $("#content");

    // Run easytabs
    $content.easytabs({
        animate: true,
        updateHash: false,
        transitionIn: 'slideDown',
        transitionOut: 'slideUp',
        animationSpeed: 600,
        tabs: ".tmenu",
        tabActiveClass: 'active',
    });

    // Hover menu effect
    $content.find('.tabs li a').hover(
        function () {
            $(this).stop().animate({marginTop: "-7px"}, 200);
        }, function () {
            $(this).stop().animate({marginTop: "0px"}, 300);
        }
    );
    /* ---------------------------------------------------------------------- */
    /*  Portfolio
    /* ---------------------------------------------------------------------- */

    // Needed variables
    var $container = $('#portfolio-list');
    var $filter = $('#portfolio-filter');

    // Run Isotope  
    $container.isotope({
        filter: '*',
        layoutMode: 'masonry',
        animationOptions: {
            duration: 750,
            easing: 'linear'
        }
    });

    // Isotope Filter 
    $filter.find('a').click(function () {
        var selector = $(this).attr('data-filter');
        $container.isotope({
            filter: selector,
            animationOptions: {
                duration: 750,
                easing: 'linear',
                queue: false,
            }
        });
        return false;
    });

    // Portfolio image animation 
    $container.find('img').adipoli({
        'startEffect': 'transparent',
        'hoverEffect': 'boxRandom',
        'imageOpacity': 0.6,
        'animSpeed': 100,
    });

    // Copy categories to item classes
    $filter.find('a').click(function () {
        var currentOption = $(this).attr('data-filter');
        $filter.find('a').removeClass('current');
        $(this).addClass('current');
    });

    /* ---------------------------------------------------------------------- */
    /*  Fancybox 
     /* ---------------------------------------------------------------------- */
    $container.find('a').fancybox({
        'transitionIn': 'elastic',
        'transitionOut': 'elastic',
        'speedIn': 200,
        'speedOut': 200,
        'overlayOpacity': 0.6
    });

    /* ---------------------------------------------------------------------- */
    /*  Contact Form
     /* ---------------------------------------------------------------------- */

    // Needed variables
    var $contactform = $('#contactform'),
        $success = 'Your message has been sent. Thank you!';

    $contactform.submit(function () {
        $.ajax({
            type: "POST",
            url: "php/contact.php",
            data: $(this).serialize(),
            success: function (msg) {
                if (msg == 'SEND') {
                    response = '<div class="success">' + $success + '</div>';
                }
                else {
                    response = '<div class="error">' + msg + '</div>';
                }
                // Hide any previous response text
                $(".error,.success").remove();
                // Show response message
                $contactform.prepend(response);
            }
        });
        return false;
    });
    /* ---------------------------------------------------------------------- */
    /*  Google Maps
     /* ---------------------------------------------------------------------- */

    // Needed variables
    var $map = $('#map'),
        $tabContactClass = ('tab-contact');

    $content.bind('easytabs:after', function (evt, tab, panel) {
        if (tab.hasClass($tabContactClass)) {
            $map.gMap({
                centerAt: {latitude: myLocation['latitude'], longitude: myLocation['longitude']},
                zoom: 16,
                //scrollwheel: false,
                maptype: 'HYBRID',
                markers: [
                    {
                        latitude: myLocation.latitude,
                        longitude: myLocation.longitude
                    }
                ]
            });

        }
    });


}); 
